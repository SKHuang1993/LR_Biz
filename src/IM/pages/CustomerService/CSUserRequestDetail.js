/**
 * Created by yqf on 2018/10/25.
 */

//请求详情

import { observer } from 'mobx-react/native';
import {observable, autorun,computed,action} from 'mobx'
import {Component} from 'react';
import React, { PropTypes } from 'react';
import {ServingClient} from '../../utils/yqfws';
import YQFNavBar from '../../components/yqfNavBar';
import Icon from '../../components/icon';
import CSUserRequestDetailHistory from './CSUserRequestDetailHistory'
import {Chat}  from '../../utils/chat'
import CSRoom from '../Chat/CSRoom'
import Enumerable from 'linq';
import ActivityIndicator from '../../components/activity-indicator/index'


import {
    TouchableHighlight,
    TouchableOpacity,
    StyleSheet,
    Image,
    ListView,
    Text,
    View,
    RefreshControl,
    Dimensions,
    BackHandler
} from 'react-native';


let window={

    width:Dimensions.get('window').width,
    height:Dimensions.get('window').height,

}


class CSUserRequestDetailModel extends Component {

    @observable isLoading = false; // 跳转到聊天页面需要显示loading
    @observable loadingText = "准备进入会话..."

}


@observer

export  default class CSUserRequestDetail extends Component {


    constructor(props){

        super(props);

        this.store = new CSUserRequestDetailModel();



    }


    _DealRequest = (data,operation) =>{



        if(operation == '查看'){

            this.props.navigator.push({
                component:CSUserRequestDetail,
                name:'CSUserRequestDetail',
                passProps:{
                    conversation:data,

                },

            });

        }else if(operation == '拒绝'){



            this.store.isLoading = true;
            this.store.loadingText = "正在拒绝会话...";
            //需要拒绝对话
            var message = {
                UserConnectionId:data.User.ConnectionId,

            }

            Chat._CSService_Reject(message,(CallBack)=>{

                this.store.isLoading = false;

            })


        }else if(operation == '接入'){

            //调用接入会话功能
            this.store.isLoading = true;
            this.store.loadingText = "正在进入会话...";

            var message = {
                UserConnectionId:data.User.ConnectionId,

            };

            Chat._CSService_Accept(message,(isFinish)=>{

                this.store.isLoading = false;

                if(isFinish == true){

                    console.log('接入会话成功了，可以跳转到IM对话窗口了...，开始聊天吧。。。')

                    this.props.navigator.push({
                        component:CSRoom,
                        passProps:{
                            conversation:data,
                        }
                    })


                }else{

                    console.log('接入会话失败，检查参数')

                }


            });



        }



    }




    //每个data里面有name和content
    renderSingleText = (data) =>{

        if(data.name=="接待客服") {
            // console.log('接待客服   特别处理');
            // console.dir(data)
        }

        var content;
        var rightTextStyle={color:'#000'};

        if(data.content=='请求超时,无应答') {
            content = data.content;
            rightTextStyle={color:'rgb(244,72,72)'};
        }else{
            content = data.content;

        }

        if(data.name =='转接次数'){

            if(data.content=='请求超时,无应答'){

                rightTextStyle={color:'rgb(244,72,72)'};
            }else{
                content = data.content +'次';

            }

        }


        return(

            <View>

                <View style={{margin:5,marginLeft:20,marginRight:20, flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>

                    <Text style={{color:'#000',padding:8,fontSize:17}}>{data.name}</Text>
                    <Text style={[rightTextStyle,{padding:8,fontSize:17}]}>{content}</Text>

                </View>

                <View style={{width:window.width,height:1,backgroundColor:'rgb(235,235,235)'}}></View>

            </View>

        )

    }



    //渲染每一级别的个人信息
    renderInfo = () =>{


        var data = this.props.conversation;

        var margin = 20;
        var ImageW = 50;

        var uri = Chat.getFaceUrlPath(data.User.UserFaceUrlPath);//头像
        var Name = data.User.UserName;//
        var GroupName = data.Group.GroupName;
        var Source = data.User.Source;
        var viewWidth = window.width - margin*2;

        var nameStyle={
            fontSize:15,color:'#333',margin:margin/2,
        }
        var GroupNameStyle={
            fontSize:15,color:'#999',marginTop:margin/2,
        }
        var SourceStyle={
            fontSize:15,color:'#999',marginTop:margin/2,
        }
        var requestHistoryStyle={
            fontSize:16,color:'rgb(244,72,72)',

        }

        var array = []

        var d1 = {
            name:"咨询客户",
            content: data.User.UserName
        };
        var d2 = {
            name:"服务组",
            content: data.Group.GroupName
        };
        var d3 = {
            name:"来源",
            content:data.User.Source
        };

        array.push(d1,d2,d3);


        var IsForwardingText,IsForwardingTextStyle,IsForwardingViewStyle;
        if(data.IsForwarding==true){

            IsForwardingText = '转接请求';

            IsForwardingTextStyle={
                fontSize:10,
                color:'rgb(130,153,252)',
                padding:5,
            };
            IsForwardingViewStyle={
                overflow:'hidden',
                borderRadius:5,
                borderWidth:1,
                borderColor:'rgb(130,153,252)',
                alignItems:'center',
                justifyContent:'center',

            }

        }else{

            IsForwardingText = '咨询请求';

            IsForwardingTextStyle={
                fontSize:10,
                color:'rgb(77,204,109)',
                padding:5,
            };
            IsForwardingViewStyle={
                overflow:'hidden',
                borderRadius:5,
                borderWidth:1,
                borderColor:'rgb(77,204,109)',
                alignItems:'center',
                justifyContent:'center',

            }

        }



        var LastRequestState;
        var state=data.RequestState;


        //#TODO 这里还有一种情况，请求被其他客服接入的情况。后期需要考虑加进去。最好是用pc做测试，接着协同测试
        if(state == "Abort"){

            LastRequestState = "请求已中断";

        }else if(state == "Timeout"){

          var type = data.CancelledReason;

          if (type=="UserLeave" ){

              LastRequestState = "用户已离开会话";

          }else if( type=="AcceptByOther"){

              LastRequestState = "请求已被其他客服接受";


          }else if(type == "Timeout"){

              LastRequestState = "请求已超时";

          }else{

              LastRequestState = "请求已超时";
          }


        }else if(state == "Accept"){
            LastRequestState = "请求待处理";

        } else if(state == "Reject"){

            LastRequestState = "请求已拒绝";

        }else if(state=="Loading"){
            LastRequestState = "请求等待中...";

        }else if(state=="Connection"){
            LastRequestState = "正在对话...";

        }else{
            LastRequestState = "请求bug";
        }


        console.log("state is ="+state+"   LastRequestState is ="+LastRequestState)


        var avatarStyle={
            width:ImageW,height:ImageW,borderRadius:ImageW/2,borderColor:'rgb(255,255,255)',margin:margin/2,
        }

        return(


            <View style={{backgroundColor:'rgb(235,235,235)'}}>


                <View style={{backgroundColor:'rgb(255,255,255)', flexDirection:'row',alignItems:'center',margin:margin,marginLeft:0,marginRight:0}}>

                    <Image style={avatarStyle} source={{uri:uri}}>
                    </Image>
                    <View style={{}}>

                        <Text  numberOfLines={1} style={nameStyle}>{Name}</Text>
                        <View style={IsForwardingViewStyle}>
                            <Text style={IsForwardingTextStyle}>{IsForwardingText}</Text>
                        </View>
                    </View>

                </View>


                <View style={{backgroundColor:'rgb(255,255,255)',marginBottom:0}}>
                    {
                        array.map((item)=>{
                            return this.renderSingleText(item)
                        })
                    }
                </View>



                        {
                            state =='Loading' ?

                                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',margin:margin}}>

                                    <TouchableOpacity onPress={()=>{  this._DealRequest(this.props.conversation,"拒绝")}} style={{overflow:'hidden',marginRight:margin/2, borderRadius:3,borderWidth:1,borderColor:'#666',justifyContent:'center',alignItems:'center',backgroundColor:'rgb(255,255,255)'}}>
                                        <Text style={{padding:30,paddingTop:10,paddingBottom:10,color:'#333'}}>{'拒绝请求'}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={()=>{ this._DealRequest(this.props.conversation,"接入")}} style={{overflow:'hidden',borderRadius:3,borderColor:'#999',  justifyContent:'center',alignItems:'center',backgroundColor:'rgb(244,72,72)'}}>
                                        <Text style={{padding:30,paddingTop:10,paddingBottom:10,color:'rgb(255,255,255)'}}>{'接受请求'}</Text>
                                    </TouchableOpacity>

                                </View>

                                :

                                <View style={{overflow:'hidden', borderRadius:3,borderWidth:0.5,borderColor:'#999', backgroundColor:'rgb(255,255,255)', justifyContent:'center',alignItems:'center',margin:margin,height:40}}>

                                    <Text style={{color:'#999',fontSize:16}}>{LastRequestState}</Text>

                                </View>

                        }

                <View style={{flexDirection:'row', alignItems:'center',justifyContent:'space-between',paddingLeft:margin,paddingRight:margin}}>

                    <Text  onPress={()=>{

                        this.props.navigator.push({
                            component:CSUserRequestDetailHistory,
                            passProps:{
                                data:data,
                            }
                        })
                    }} numberOfLines={1} style={requestHistoryStyle}>{"请求记录"}</Text>

                    <Text  onPress={()=>{



                        data.Messages = Chat.insertDateMessages(Enumerable.from(data._Messages).takeFromLast(15).toArray())
                        this.props.navigator.push({

                            component: CSRoom,
                            passProps: { conversation: data }

                        });



                    }} numberOfLines={1} style={requestHistoryStyle}>{"历史消息"}</Text>



                </View>






            </View>



        )

    }

    _renderNav = () =>{

        return (
            <YQFNavBar title={'请求详情'}
                       leftIcon={'0xe183'}
                       onLeftClick={() => {
                           this.props.navigator.pop()
                       }}/>

        )

    }

    renderLoading() {

        if (this.store.isLoading) {

            return <ActivityIndicator toast text={this.store.loadingText} animating={this.store.isLoading}/>

        }

        return null;
    }

    render = ()=>{

        return (

            <View style={{backgroundColor: 'rgb(240,240,240)', flex: 1}}>

                {this._renderNav()}

                {this.renderInfo()}


                {this.renderLoading()}


            </View>

        );

    }







}

