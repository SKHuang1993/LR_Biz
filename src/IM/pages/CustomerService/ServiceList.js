/**
 * Created by yqf on 2018/10/25.
 */
/**
 * Created by yqf on 2018/10/24.
 */

//获取用户的请求历史详情




import { observer } from 'mobx-react/native';
import {observable, autorun,computed,action} from 'mobx'
import {Component} from 'react';
import React, { PropTypes } from 'react';

import YQFNavBar from '../../components/yqfNavBar';


import {Chat}  from '../../utils/chat'
import ActivityIndicator from '../../components/activity-indicator/index'
import CSUserRequestDetail from './CSUserRequestDetail'
import CSRoom from '../Chat/CSRoom'
import EmptyView  from '../../components/EmptyView';


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
    BackHandler,
    Navigator
} from 'react-native';


let window={

    width:Dimensions.get('window').width,
    height:Dimensions.get('window').height,

}


class ServiceListModel extends Component {


    @observable isEmpty = Chat.obj.CSConversations.length<=0 ? true:false; //一开始不要设置为空

    @observable isLoading = false; // 跳转到聊天页面需要显示loading

    @observable loadingText = "准备进入会话..."

    @observable isShow = false; // 是否显示对应的转接请求

    @observable loading = false;

    @observable Forwardings =[];

    @computed get getDataSource(){

        ds = new ListView.DataSource({rowHasChanged:(r1,r2)=>r1 !==r2});
        return ds.cloneWithRows(Chat.obj.CSConversations.slice());
    }


}



@observer

export default class ServiceList extends Component {

    constructor(props){

        super(props);

        this.store = new ServiceListModel();

        // console.log('现在的客服数据缓存  Chat.obj.CSConversations');
        // console.dir(Chat.obj.CSConversations);
    }


    //#TODO   _GetTimeTextBySeconds 这个方法需要再进行调试，如果18000，需要返回5时
    _GetTimeTextBySeconds = (second) =>{

        var h,m,s,content="";
        h = parseInt(second / 3600);
        if(h==0){
            m = parseInt(second/60) ;

            //如果m == 0 代表时间不足1分钟，都是秒数
            if(m==0){

                s = second;

            }else{

                s = second - m * 60;
            }

        }else{


            m = parseInt( (second - h * 3600) / 60);

            //如果m == 0 代表时间不足1分钟，都是秒数
            if(m==0){
                s = second;

            }else{

                s = second - m * 60;
            }

        }


        if(h>0){
            content += h + '时'
        }
        if(m>0){
            content += m + '分'
        }
        if(s>0){
            content += s  + '秒'
        }
        if(second){
            return content;

        }else {
            return "请求超时,无应答"
        }


    }


    //获取时间  2018-10-24T0：04：58
    _GetTimeTextByDate = (date) =>{

        var str = String(date).substring(0,16);

        var a = str.replace('T'," ");
        return a;

    }

    //弹出转接请求框
    _showForwarding = (data) =>{

        if(data.ForwardingCount>0 && data.Forwardings){

            this.store.isShow = true;
            this.store.Forwardings = data.Forwardings.slice();//复制数组到转接请求

        }

    }


    _DealRequest = (data,operation) =>{

        // console.log("处理客服会员  _DealRequest  ---data")
        // console.dir(data);


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



    renderLoading() {

        if (this.store.isLoading) {

            return <ActivityIndicator toast text={this.store.loadingText} animating={this.store.isLoading}/>

        }

        return null;
    }


    renderRow = (data)=>{


        //在这里将数据整理，接着用map进行显示
        //下面那个文本可能是咨询请求，也可能是转接请求

        var margin = 20;
        var imageW = 50;


        var imageUrl,nameText;
        //具备转接这个节点
        if (data.ForwardingFromService){

            imageUrl = Chat.getFaceUrlPath(data.ForwardingFromService.UserFaceUrlPath)
            nameText = data.ForwardingFromService.UserName ?  data.ForwardingFromService.UserName:'unkwown';

        }else{
             imageUrl = Chat.getFaceUrlPath(data.User.UserFaceUrlPath)
             nameText = data.User.UserName ?  data.User.UserName :'unkwown';
        }


        var timeText = this._GetTimeTextByDate(data.CreateTime);

        var LastRequestState,LastRequestStateStyle,operation,IsForwardingText,IsForwardingTextStyle,IsForwardingViewStyle,timeStyle;
        var state = data.RequestState;

        timeStyle = {

            marginTop:margin/4,
            marginBottom:margin/4,

            fontSize:12,
            color:'#999',
        };

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



        if(state == 'Abort'){
            LastRequestState = "已中断";
            LastRequestStateStyle={color:'orange',marginLeft:margin/2}
            operation = ['查看']

        }else if(state == 'Timeout'){
            LastRequestState = "已超时";
            LastRequestStateStyle={color:'#999',marginLeft:margin/2}
            operation = ['查看']

        }else if(state == 'Accept'){
            LastRequestState = "待处理";
            LastRequestStateStyle={color:'blue',marginLeft:margin/2}
            operation = ['查看','拒绝','接入']

        } else if(state == 'Reject'){
            LastRequestState = "已拒绝";
            LastRequestStateStyle={color:'red',marginLeft:margin/2}
            operation = ['查看']

        }else if(state=='Loading'){

            LastRequestState = "等待中...";
            LastRequestStateStyle={color:'#999',marginLeft:margin/2}
            operation = ['查看','拒绝','接入']

        }else if(state=='Connection'){

            LastRequestState = "正在对话...";
            LastRequestStateStyle={color:'#999',marginLeft:margin/2}
            operation = ['查看']

        }else{
            LastRequestState = "bug";
            LastRequestStateStyle={color:'#999',marginLeft:margin/2}
            operation = ['查看','拒绝','接入']
        }



        return(

            <TouchableOpacity onPress={()=>{
                this._DealRequest(data,'查看');
            }}>


                <View style={{flexDirection:'row',backgroundColor:'rgb(255,255,255)',}}>

                    <Image style={{ width: imageW, height: imageW, borderRadius: 3, margin: margin/2}}
                           source={{ uri: imageUrl }}>
                    </Image>



                    <View style={{margin:margin/2,flex:1,justifyContent:'space-between'}}>

                        <View style={{ flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>

                            <Text style={{color:'#333',fontSize:16}}>{nameText}</Text>
                            <Text style={LastRequestStateStyle}>{LastRequestState}</Text>

                        </View>

                        <Text style={timeStyle}>{timeText}</Text>


                        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>



                            <View>


                                <View style={IsForwardingViewStyle}>
                                <Text style={IsForwardingTextStyle}>{IsForwardingText}</Text>
                                </View>


                            </View>


                            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center'}}>

                                {
                                    operation.map((item)=>{

                                        return(

                                            <TouchableOpacity onPress={()=>{

                                                this._DealRequest(data,item)

                                            }}>

                                                <View style={ [{overflow:'hidden', borderRadius:5, alignItems:'center', justifyContent:'center',marginLeft:margin/2},item=='接入'? {backgroundColor:'rgb(242,164,81)'} : {borderWidth:0.5, backgroundColor:'rgb(255,255,255)'}]   }>
                                            <Text style={[{fontSize:11, padding:10,paddingTop:5,paddingBottom:5},item=='接入'?{color:'#fff',borderColor:'rgb(242,164,81)'}:{color:'#666',borderColor:'#999'}]   }>{item}</Text>
                                                </View>

                                            </TouchableOpacity>

                                        )
                                    })
                                }


                            </View>

                        </View>


                    </View>



                </View>





                <View style={{height:1, backgroundColor:'rgb(235,235,235)', width:window.width}}></View>


            </TouchableOpacity>

        )
    }





    renderEmpty = () =>{

            return         <EmptyView title={'当前暂无客服咨询请求'} icon={'0xe15c'}/>

    }

    renderListview = ()=>{

        return(

            <ListView
                dataSource={this.store.getDataSource}
                enableEmptySections={true}
                renderRow={this.renderRow}
                removeClippedSubviews={false}
            ></ListView>

        )

    }
    //导航条
    renderNavBar=()=>{


        var title ='请求列表';
        return(
            <YQFNavBar  leftIcon={'0xe183'}
                        onLeftClick={()=>{this.props.navigator.pop()}}
                        title={title}/>
        )



    }

    renderContent = ()=>{

        if (this.store.isEmpty){
            return this.renderEmpty()
        }
        return this.renderListview()

    }


    render = ()=>{

        return(

            <View style={{flex:1,backgroundColor:'rgb(240,240,240)'}}>




                {this.renderNavBar()}

                {this.renderLoading()}

                {this.renderContent()}





            </View>
        )

    }



}













