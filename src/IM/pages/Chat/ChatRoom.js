import React from 'react';

import {
    ListView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet, TextInput, Button, ScrollView, Modal,
} from 'react-native';

import Message from './message';
import NavBar from '../../components/navBar';

import YQFNavBar from '../../components/yqfNavBar';
import Icon from '../../components/icon';

import { observer } from 'mobx-react/native';
import Conversation from '../../stores/Chat/ChatRoom';
import InputToolbar, { MIN_INPUT_TOOLBAR_HEIGHT } from './inputToolBar';
import { COLORS, FLEXBOX } from '../../styles/commonStyle';
import { Chat } from '../../utils/chat';
import Enumerable from 'linq';
import ActivityIndicator from '../../components/activity-indicator';
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter';
import ImageViewer from 'react-native-image-zoom-viewer';
import Emoji from './emoji';

import ChatDetail from './ChatDetail';
import Webview from './webview';
import { isIphoneX } from 'react-native-iphone-x-helper'
import Multi_Contact from '../Contact/Multi_Contact';



@observer

export default class ChatRoom extends React.Component {


    constructor(props) {
        super(props);


      //  console.log("从上一个页面传递过来的值")
      //  console.dir(props);

        this.store = new Conversation();


        //这个页面尽量需要上一个页面传一个conversation进来。
        this.store.conversation = props.conversation;

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



        this.listener = RCTDeviceEventEmitter.addListener('OnChat', (message) => {
            Chat.setReadMessage(this.store.conversation);
            Chat.saveConversationList(Chat.obj.conversations);
            this.scrollToBottom(true);
        });
        this.reSend = RCTDeviceEventEmitter.addListener('ReSend', (message) => {
            //console.log(message);
            this.store.reSend(message);
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
        this.updateConversation = RCTDeviceEventEmitter.addListener('UpdateConversation', (conversations) => {
            let conversation = conversations.find(o => o.IMNr == this.store.conversation.IMNr);
            if (conversation) {
                this.store.conversation = conversation;
                Chat.setReadMessage(this.store.conversation);
                Chat.saveConversationList(Chat.obj.conversations);
                this.scrollToBottom(true);
            }
        });
        Chat.setReadMessage(this.store.conversation);
        Chat.saveConversationList(Chat.obj.conversations);
    }

    componentWillUnmount() {

        this.listener.remove();
        this.reSend.remove();
        this.openImageViewer.remove();
        this.openWebView.remove();
        this.updateConversation.remove();
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





                    Chat.sendTextMessage(this.store.conversation, this.store.text);


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

          this.props.navigator.pop();

        });

    }

    //转接会话
    CSService_Forwarding = (IMNr)=>{
        var message= {
            UserConnectionId: this.props.conversation.User.ConnectionId,
            ForwardingServiceId: IMNr,
        };
        Chat._CSService_Forwarding(message,()=>{



            //TODO 转接会话之后是否要在这里面做处理（接下来要怎么处理？？？？是否直接返回到上一个页面）
            //转接请求发出后，这里需要插入一句  "已发送转接请求，等待客服'林钦记'应答"
            //客服收到请求:     客服"aaa"接受了你的转接请求      客服"aaa"拒绝了你的转接请求        客服"aaa"应答超时

        })


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
                                <Text style={{color:'#666',fontSize:16,margin:10,}}>{'挂断后,将终止与用户对话并关闭聊天窗口'}</Text>
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



        if(this.props.isFromCS && this.props.isFromCS==true){

            return(

                    <YQFNavBar type="CSRequest"

                               title={'聊天页面'}
                               onPressLeft1={()=>{this.props.navigator.pop()}}
                               onPressRight1={()=>{this.store.isShowStopDiamond=true}}
                               onPressRight2={()=>{

                                   this.props.navigator.push({
                                       component:Multi_Contact,
                                       passProps:{
                                           type:'ChooseCS',//选择客服
                                           isSingleSelect:true,//是否多选。如果
                                           getContact:(array)=>{

                                               console.log("这是要转接的对应的客服。接下来在这里要调用Chat里面关于转接客服的参数")
                                             //  console.dir(array);

                                               var IMNr = array[0].User.IMNr;
                                               this.CSService_Forwarding(IMNr);

                                           }
                                       }

                                   })

                               }}
                    />

                )


        }else {

            return(
                <YQFNavBar
                    titleStyle={{ width: FLEXBOX.width * 0.6 }}
                    title={this.store.conversation.Name}
                    navigator={this.props.navigator}
                    leftIcon={'0xe183'}
                    rightIcon={'0xe131'}
                    OnLeftClick={()=>{
                        if(Chat.obj.Source == '我去过'){
                            this.props.navigator.pop();
                        }
                    }}

                    onRightClick={()=>{
                        if(this.store.conversation.BanSpeck==true){

                        }else{

                            this.props.navigator.push({
                                component:ChatDetail,
                                passProps:{
                                    conversation:this.store.conversation
                                }  })
                        }   }}
                />       )

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
