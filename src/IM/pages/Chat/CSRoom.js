/**
 * Created by yqf on 2018/12/10.
 */


//IM 客服聊天室。只要是为了和之前的IM客服隔离开来


import React from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet, TextInput, Button, ScrollView, Modal,
} from 'react-native';

import Message from './message';

import YQFNavBar from '../../components/yqfNavBar';
import Icon from '../../components/icon';

import { observer } from 'mobx-react/native';
import InputToolbar, { MIN_INPUT_TOOLBAR_HEIGHT } from './inputToolBar';
import { COLORS, FLEXBOX } from '../../styles/commonStyle';
import ActivityIndicator from '../../components/activity-indicator';
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import ImageViewer from 'react-native-image-zoom-viewer';
import Emoji from './emoji';
import Webview from './webview';
import { isIphoneX } from 'react-native-iphone-x-helper'
import Multi_Contact from '../Contact/Multi_Contact';



import { extendObservable, action, computed, toJS, observable, autorun } from 'mobx';
import { Alert, NativeModules, ListView, StatusBar } from 'react-native';
import Enumerable from 'linq';
import moment from 'moment';
import deepDiffer from 'deepDiffer';
import ImagePicker from 'react-native-image-picker';
import { ServingClient } from '../../utils/yqfws';
import { Chat } from '../../utils/chat';

class CSRoomModel {

    //SKHuang 关于转接聊天模块
    @observable isShowStopDiamond = false; // 是否显示中止聊天的弹框
    @observable Forwarding ={}  // 转接客服的对象
    @observable isForwardingClick = true;//转接按钮是否可点击

    isLoading = false;
    @observable conversation = {};
    @observable text = "";
    @observable pageIndex = 1;
    @observable ImageIndex = 0;
    @observable ImagesUrl = [];

    @computed get getDataSource() {
        ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
        return ds.cloneWithRows(this.conversation.Messages.slice());
    }

    photoOptions = {
        quality: 0.70,
        allowsEditing: false,
        noData: false,
        maxWidth: FLEXBOX.width * FLEXBOX.pixel,
        maxHeight: FLEXBOX.height * FLEXBOX.pixel,
        storageOptions: {
            skipBackup: true,
            path: 'images'
        }
    }

    //会话页面日期的显示格式
    getTimeStamp = (time) => {
        let date = moment(time);
        let now = moment();
        if (date.format("YYYY-MM-DD") == moment().format("YYYY-MM-DD"))
            return date.format("HH:mm");
        else if (now.year() != date.year())
            return date.format("YYYY-MM-DD HH:mm");
        else if (now.month() == date.month() && now.date() - date.date() < 7) {
            if (now.date() - date.date() == 1)
                return "昨天" + " " + date.format("HH:mm");
            else
                return date.format("dddd") + " " + date.format("HH:mm");
        }
        else
            return date.format("MM-DD") + " " + date.format("HH:mm");
    }

    launchCamera = (callback) => {
        ImagePicker.launchCamera(this.photoOptions, (response) => {
            //console.log(response);
            if (response.data) {
                let param = {
                    Url: "data:image/png;base64," + response.data,
                    Base64: response.data,
                    Width: response.width,
                    Height: response.height,
                }


                Chat.sendCSImageMessage(this.conversation, param);



                if (callback)
                    callback();
            }
        });
    }



    launchImageLibrary = (callback) => {
        StatusBar.setBarStyle("default");
        ImagePicker.launchImageLibrary(this.photoOptions, (response) => {
            StatusBar.setBarStyle("light-content");
            //console.log(response);
            if (response.data) {
                let param = {
                    Url: "data:image/png;base64," + response.data,
                    Base64: response.data,
                    Width: response.width,
                    Height: response.height,
                }
                Chat.sendCSImageMessage(this.conversation, param);
                if (callback)
                    callback();
            }
        });
    }


    //消息发送失败时进行重发
    reSend = async (message) => {
        if (message) {
            if (message.ChatMessage.MessageType == "Text") {
                message.Status = 3;
                Chat.sendMessage(message, this.conversation);
            } if (message.ChatMessage.MessageType == "Image") {
                message.Status = 3;
                let param = {
                    BucketName: 'yqf-imres',
                    ImageBytes: message.ChatMessage.ImageContent.Base64
                }
                let result = await ServingClient.execute("Base.ImageUpload", param);
                if (result && result.Path) {
                    message.ChatMessage.ImageContent.Url = "https://res.im.yiqifei.com" + result.Path;
                    delete message.ChatMessage.ImageContent.Base64;
                }
                Chat.sendMessage(message, this.conversation, message.ChatMessage.ImageContent.Base64);
            }
        }
    }

    //初始化ImageViewer
    initImageViewer = (obj) => {
        let images = Enumerable.from(this.conversation.Messages).where(o => o.ChatMessage && o.ChatMessage.MessageType == "Image").toArray();
        this.ImagesUrl = Enumerable.from(images).select(o => { return { url: o.ChatMessage.ImageContent.Url } }).toArray();
        let index = images.findIndex(o => {
            let o2 = { ...obj };
            delete o2.position;

            let o1 = toJS(o);
            delete o1.position;
            return !deepDiffer(o1, o2);
        });
        if (index != -1) {
            this.ImageIndex = index;
        }
    }
}





@observer

export default class CSRoom extends React.Component {


    constructor(props) {
        super(props);



        this.store = new CSRoomModel();


        //这个页面尽量需要上一个页面传一个conversation进来。
        this.store.conversation = props.conversation;

        // console.dir(this.store.conversation)

        //加多一个属性，判断是否为客服系统过来的。如果为客服系统过来的，则样式有区别  IsFromCS ==true 证明来自IM会话,同时还要有连接会话的ID

        this.state = {
            isLoading: false,
            contentContainerStyle: false,
            a: true,
            imageViewer: false
        }
    }


    componentDidMount() {


        //#TODO 这里要加上关于客服收到消息之后的通知。接着将消息处理为已读，同时将消息存到本地。函数里面的处理方法，也要重新修复的
        this.CSListener = RCTDeviceEventEmitter.addListener('OnCSChat',(message)=>{


            Chat.saveCSConversationList(Chat.obj.CSConversations);
            this.scrollToBottom(true);



        })




        //用户结束聊天，返回到上一个页面
        this.OnCSService_UserLeave = RCTDeviceEventEmitter.addListener('OnCSService_UserLeave', (message) => {

            var content = "用户 "+this.props.conversation.User.UserName+" 已离开对话，当前对话将关闭。"
            Alert.alert(
                null,
                content,
                [
                    {text: '确定', onPress: () => { this.props.navigator.pop()} }
                ]
            )
        });


        //客服转接之后的结果
        this.OnCSService_ForwardingResult = RCTDeviceEventEmitter.addListener('OnCSService_ForwardingResult', (message) => {

            this.store.isForwardingClick =true;


            this.DealForwardingResult(message);

            this.scrollToBottom(true);


        });

        //收到了客服发送的消息
        this.OnCSService_Chat = RCTDeviceEventEmitter.addListener('OnCSService_Chat', (message) => {
                Chat.setReadMessage(this.store.conversation);
                Chat.saveCSConversationList(Chat.obj.CSConversations);
                this.scrollToBottom(true);
            });


        /*
        this.listener = RCTDeviceEventEmitter.addListener('OnChat', (message) => {
            Chat.setReadMessage(this.store.conversation);
            Chat.saveConversationList(Chat.obj.conversations);
            this.scrollToBottom(true);
        });
        */


        this.reSend = RCTDeviceEventEmitter.addListener('ReSend', (message) => {
            //console.log(message);
           // this.store.reSend(message);
        });


        this.openImageViewer = RCTDeviceEventEmitter.addListener('OpenImageViewer', (message) => {
            this.store.initImageViewer(message);
            this.toggle();
        });
        this.openWebView = RCTDeviceEventEmitter.addListener('OpenWebView', (message) => {
            this.props.navigator.push({
                component: Webview,
                passProps: { url: message.Url, title: message.Title }
            });
        });

        //这里是为了更新这个页面
        this.UpdateCSConversation = RCTDeviceEventEmitter.addListener('UpdateCSConversation', (conversations) => {

            console.log("UpdateCSConversation   CSRoom页面接收到通知，需要")

            let conversation = conversations.find(o => o.User.ConnectionId == this.store.conversation.User.ConnectionId);
            if (conversation) {
                this.store.conversation = conversation;

                //这里表示已读。在客服系统没所谓什么已读未读
              //  Chat.setReadMessage(this.store.conversation);
                Chat.saveCSConversationList(Chat.obj.CSConversations);
                this.scrollToBottom(true);
            }
        });
       // Chat.setReadMessage(this.store.conversation);

        Chat.saveCSConversationList(Chat.obj.CSConversations);
    }

    componentWillUnmount() {

        //用户结束聊天，返回到上一个页面
        this.OnCSService_UserLeave.remove();
        //用户转接结果
        this.OnCSService_ForwardingResult.remove();

        //收到客服消息，要刷新页面
        this.OnCSService_Chat.remove();

        this.CSListener.remove();

      //  this.listener.remove();
        this.reSend.remove();
        this.openImageViewer.remove();
        this.openWebView.remove();
        this.UpdateCSConversation.remove();
    }

    renderRow = (message, sectionId, rowId) => {

        let position;
        // if (Math.floor(Math.random() * 2)) {  // 时间日期 || 其他提示
        //     position = "center";
        // } else {
        //     position = Math.floor(Math.random() * 2) ? 'right' : 'left'; //当前发信息用户是自己为true 否则为false
        // }
        if (message.MessageType === "Time") {
            message.position = "center";
            message.noteText = this.store.getTimeStamp(message.NoteText);
        }
        else if (message.ChatMessage.MessageType == "Notify") {
            message.position = "center";
            message.noteText = message.ChatMessage.NotifyContent.Notify;
        } else
            message.position = message.IsSender ? 'right' : 'left';
        const messageProps = {
            ...this.props,
            position: position,
            noteText: '上午6:00', // 时间日期内容 || 其他提示内容
            ...message
        };



        return <Message message={message} />;
    }

    toggle = () => {
        this.setState({
            imageViewer: !this.state.imageViewer
        })
    }

    renderInputToolbar = () => {
        const inputToolbarProps = {
            // onSend: this.onSend(),

        };

        //如果可以聊天，则显示下面的输入框
        return (
            <InputToolbar
                actionsList={
                    [{ title: '照片', icon: '0xe1e4', action: () => { this.store.launchImageLibrary(() => this.scrollToBottom()) } },
                        { title: '拍照', icon: '0xe12c', action: () => { this.store.launchCamera(() => this.scrollToBottom()) } }]}
                onFocus={() => {
                    //this.onfocus()

                    if (this.contentHeight < this.lvHeight) {
                        this.setState({ a: false });
                    }

                }}
                onBlur={() => {
                    //this.onblur()
                    this.setState({ a: true });
                }}
                value={this.store.text}
                onChangeText={(v) => {
                    if (this.store.text && v == this.store.text.substr(0, this.store.text.length - 1)) {
                        if (!this.delEmoji())
                            this.store.text = v;
                    } else
                        this.store.text = v;

                }}
                ref={"InputToolbar"}
                onSubmitEditing={() => {



                        Chat.CSSendTextMessage(this.store.conversation, this.store.text);
                        this.store.text = null;
                        this.scrollToBottom(true);




                }}
                handleEmojiClick={(v) => {
                    if (!this.store.text) this.store.text = v;
                    else
                        this.store.text += v
                }}
                onDelete={() => {
                    let index = this.store.text.lastIndexOf("[");
                    if (!this.delEmoji())
                        this.store.text = this.store.text.substr(0, this.store.text.length - 1);
                }}
                style={{ flex: 0.08 }}
            />
        );
    }

    delEmoji = () => {
        let index = this.store.text.lastIndexOf("[");
        if (index != -1) {
            let str = this.store.text.substr(index, this.store.text.length);
            if (Emoji.map.has(str)) {
                this.store.text = this.store.text.substr(0, this.store.text.length - str.length);
                return true;
            }
        }
        return false;
    }

    scrollToBottom = (animated) => {
        if (this.store.isLoading) return;
        setTimeout(() => {
            if ("listHeight" in this.state &&
                "footerY" in this.state &&
                this.state.footerY > this.state.listHeight) {
                var scrollDistance = this.state.listHeight - this.state.footerY;
                if (this.refs.ListView)
                    this.refs.ListView.getScrollResponder().scrollTo({ x: 0, y: -scrollDistance, animated: animated ? animated : false });
            }
        }, 200)
    }

    onfocus = () => {
        setTimeout(() => {
            if (this.refs.InputToolbar)
                this.refs.InputToolbar.measure((ox, oy, width, height, px, py) => {
                    if (this.contentHeight < this.lvHeight) {
                        if (this.refs.ListView)
                            this.refs.ListView.getScrollResponder().scrollTo({ x: 0, y: -(FLEXBOX.height - py) + 50, animated: false });
                    }
                });
        }, 400)
    }


    onblur = () => {
        setTimeout(() => {
            if (this.contentHeight < this.lvHeight) {
                if (this.refs.ListView)
                    this.refs.ListView.getScrollResponder().scrollTo({ x: 0, y: 0, animated: false });
            }
        }, 300)
    }


    //离开会话
    CSService_Leave = ()=>{

        var ConnectionId = this.props.conversation.User.ConnectionId;

        var message ={

            UserConnectionId:ConnectionId,
        };

        Chat._CSService_Leave(message,()=>{

            //返回到上一页面
            this.props.navigator.pop();




        });

    }


    //转接会话
    CSService_Forwarding = (IMNr,Name)=>{
        var message= {
            UserConnectionId: this.props.conversation.User.ConnectionId,
            ForwardingServiceId: IMNr,
            Name:Name,
            conversation:this.props.conversation
        };
        Chat._CSService_Forwarding(message,(callback)=>{

            if(callback==true){

                console.log("转接请求发出成功....")
                //这里代表发出转接请求成功。禁止该按钮被点击。
                this.store.isForwardingClick =false;
                this.scrollToBottom(true);

            }else{

                //这里证明是转接失败
                this.store.isForwardingClick =true;
                this.scrollToBottom(true);

                console.log("转接请求发出失败....")
            }

        })


    }



    //处理转接结果
    DealForwardingResult = (Message) =>{

        // console.log("_DealForwardingResult ---- 转接客服返回的结果。可能是三种情况...")
        // console.dir(Message)

        //在数组里面找对应的这个
        var findIndex = Chat.obj.CSConversations.findIndex((o)=>{
            //证明这是有User这个节点的.
            if(o.User){

                return o.User.ConnectionId == Message.User.ConnectionId;

            }else{
                return -1;
            }
        })

        //   这里应该是改成王换。在这里要怎么设置处理会好一点呢 ？
        //1.已发送转接消息，等待客服 黄松凯 应答
        //2.客服 黄松凯 接受了你的聊天请求
        //3.客服 黄松凯 拒绝了你的聊天请求
        //4.客服 黄松凯 应答超时


        var content="";
        if(Message.Result == "Timeout"){

            content = "转接已超时";
        }else if(Message.Result == "Success"){


            //修改状态，已中断，原因为 转接给其他同事

            var findIndex = Chat.obj.CSConversations.findIndex((o)=>{
                //证明这是有User这个节点的.
                    return o.User.ConnectionId == Message.User.ConnectionId;

            })


            var temp = Chat.obj.CSConversations.slice();
            var item = temp[findIndex]
            item.RequestState = "Abort";

            Chat.obj.CSConversations=item;
            Chat.saveCSConversationList(Chat.obj.CSConversations)


            content = "对话已成功转接";

            var currentContent = "对话已被客服 "+this.store.Forwarding.Name + " 转接,当前会话将关闭。"
            Alert.alert(
                null,
                currentContent,
                [
                    {text: '确定', onPress: () => { this.props.navigator.pop()} }
                ]
            )


        }else if(Message.Result == "Reject"){

            content = "客服 "+this.store.Forwarding.Name + " 拒绝了你的转接请求";

        }

        Chat.insertCSNotificationMessage(Chat.obj.CSConversations[findIndex],content)



    }




//中止弹框
    renderStopDiamond = () =>{

        if (this.store.isShowStopDiamond ==false){
            return null
        }else {

            var height = 250;
            var top = (window.height - height) / 2;
            var  margin=20;

            return(

                <View style={{position:'absolute',top:0,bottom:0,left:0,right:0,
                    backgroundColor:'rgba(0,0,0,0)'}}>

                    <TouchableOpacity style={{position:'absolute',top:0,bottom:0,left:0,right:0,
                        backgroundColor:'rgba(0,0,0,0.3)',alignItems:'center',justifyContent:'center'}} onPress={()=>{

                        this.store.isShowStopDiamond = false;
                    }
                    }>

                        <View style={{width:window.width-margin*2,marginLeft:margin,  backgroundColor:'rgb(255,255,255)', borderRadius:5, overflow:'hidden'}}>

                            <View style={{alignItems:'center',justifyContent:'space-between',flexDirection:'row',margin:10}}>

                                <Text>{''}</Text>
                                <Text style={{color:'#333',fontSize:20}}>{'提示'}</Text>
                                <Icon onPress={()=>{this.store.isShow=false}} icon='0xe198' size={18} color={'#333'} />
                            </View>


                            <View style={{alignItems:'center'}}>

                                <Text style={{color:'#666',fontSize:16,margin:10,}}>{'挂断将终止与用户对话,并将关闭此聊天窗口。是否继续'}</Text>
                                <Text style={{color:'#666',fontSize:16}}>{'确定挂断吗?'}</Text>


                            </View>


                            <View style={{flexDirection:'row',justifyContent:'space-around',alignItems:'center',margin:20}}>


                                <TouchableOpacity onPress={()=>{

                                    this.store.isShowStopDiamond = false;


                                }} style={{overflow:'hidden', borderRadius:3,borderWidth:1,borderColor:'#666',justifyContent:'center',alignItems:'center',backgroundColor:'rgb(255,255,255)'}}>
                                    <Text style={{padding:30,paddingTop:10,paddingBottom:10,color:'#333'}}>{'取消'}</Text>
                                </TouchableOpacity>


                                <TouchableOpacity onPress={()=>{

                                    this.store.isShowStopDiamond = false;
                                    //#TODO 这里还要执行中止会话的操作。并考虑是否要返回上一级或者停留在这页面
                                    this.CSService_Leave();

                                }} style={{overflow:'hidden',borderRadius:3,borderWidth:1,borderColor:'#999',  justifyContent:'center',alignItems:'center',backgroundColor:'rgb(244,72,72)'}}>
                                    <Text style={{padding:30,paddingTop:10,paddingBottom:10,color:'rgb(255,255,255)'}}>{'确定'}</Text>

                                </TouchableOpacity>

                            </View>

                        </View>


                    </TouchableOpacity>






                </View>

            );




        }

    }


    renderNav = ()=>{


        if (this.store.conversation.BanSpeak == true){

            return(

            <YQFNavBar title={this.props.conversation.User.UserName}
                       leftIcon={'0xe183'}
                       onLeftClick={() => {
                           this.props.navigator.pop()
                       }}/>

            )

        }else{

            return(

                <YQFNavBar  type="CSRequest"

                           title={this.props.conversation.User.UserName}
                           onPressLeft1={()=>{this.props.navigator.pop()}}
                           onPressRight1={()=>{this.store.isShowStopDiamond=true}}
                           onPressRight2={()=>{


                               if (this.store.isForwardingClick == true){

                                   this.props.navigator.push({
                                       component:Multi_Contact,
                                       passProps:{
                                           type:'ChooseCS',//选择客服
                                           isSingleSelect:true,//是否多选。如果
                                           getContact:(array)=>{

                                               var IMNr = array[0].User.IMNr;
                                               var Name =  array[0].User.Name;

                                               //存在这里是因为要转接给其他同事
                                               this.store.Forwarding = {
                                                   IMNr:IMNr,
                                                   Name:Name
                                               }
                                               this.CSService_Forwarding(IMNr,Name);

                                           }
                                       }

                                   })

                               }else{

                                   //弹出提示框。显示现在转接还未反应，需要等到系统返回之后才能再次点击
                                   var content = "你已发出转接请求，请等待客服 "+this.store.Forwarding.Name+" 响应后重试。"
                                   Alert.alert(
                                       null,
                                       content,
                                       [
                                           {text: '确定', onPress: () => {} }
                                       ]
                                   )

                               }


                           }}
                />

            )



        }



    }




    render() {
        return (
            <View style={styles.container}>

                {this.renderNav()}

                <ScrollView bounces={false} keyboardShouldPersistTaps="always" keyboardDismissMode={"on-drag"} showsVerticalScrollIndicator={false}>
                    <View style={{ height: FLEXBOX.height - 64 - (isIphoneX() ? 58 : 0) }}>
                        <ListView
                            onTouchStart={() => this.refs.InputToolbar.hideToolBar()}
                            ref={"ListView"}
                            style={{ flex: 1 }}
                            dataSource={this.store.getDataSource}
                            onLayout={(e) => {
                                this.lvHeight = e.nativeEvent.layout.height;
                                this.setState({
                                    listHeight: e.nativeEvent.layout.height
                                });
                                this.scrollToBottom(this.isDidMount);
                                this.isDidMount = true;
                            }}
                            enableEmptySections={true}
                            renderRow={this.renderRow}
                            keyboardDismissMode={"on-drag"}
                            initialListSize={300}
                            renderHeader={() => { return (this.state.isLoading && <ActivityIndicator text="加载中..." />) }}
                            onScroll={(e) => {
                                let y = e.nativeEvent.contentOffset.y;
                                if (y <= 0 && !this.store.isLoading) {
                                    let messages = Enumerable.from(this.store.conversation._Messages).reverse().skip(this.store.conversation.Messages.length).take(15).toArray().reverse();
                                    if (messages.length == 0) return;

                                    this.store.isLoading = true;
                                    this.setState({ isLoading: true })
                                    setTimeout(() => {
                                        this.store.conversation.Messages = Enumerable.from(this.store.conversation.Messages).insert(0,
                                            Chat.insertDateMessages(messages)).toArray()
                                        this.store.pageIndex++;
                                        setTimeout(() =>
                                            this.store.isLoading = false, 1000);
                                        this.setState({ isLoading: false })
                                    }, 1000);
                                }
                            }}
                            onContentSizeChange={(width, height) => this.contentHeight = height}
                            contentContainerStyle={this.state.a ? { paddingTop: 10, } : { flexGrow: 1, justifyContent: 'flex-end', paddingTop: 10, }}
                            renderFooter={() => {
                                return <View onLayout={(event) => {
                                    var layout = event.nativeEvent.layout;
                                    this.setState({
                                        footerY: layout.y
                                    });
                                }}></View>
                            }}
                        />
                        <View>
                            {this.renderInputToolbar()}
                        </View>
                    </View>
                </ScrollView>

                <Modal onRequestClose={() => this.toggle()} visible={this.state.imageViewer} transparent={true}>
                    <ImageViewer renderIndicator={() => null} loadingRender={() => <ActivityIndicator />} imageUrls={this.store.ImagesUrl} index={this.store.ImageIndex} onClick={() => {
                        this.toggle();
                    }} />
                </Modal>


                {this.renderStopDiamond()}


            </View >
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },

});
