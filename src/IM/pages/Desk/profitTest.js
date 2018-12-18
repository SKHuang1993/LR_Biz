/**
 * Created by yqf on 2018/8/30.
 */


import {observer} from 'mobx-react/native';
import {observable, autorun, computed, extendObservable, action, toJS} from 'mobx'
import {Component} from 'react';
import React, {PropTypes} from 'react';
import Icon from '../../components/icon';
import ActivityIndicator from '../../components/activity-indicator'

import {
    View,
    Text,
    Image,
    StyleSheet,
    ListView,
    ScrollView,
    TouchableWithoutFeedback,
    TouchableOpacity,

    InteractionManager,
    StatusBar,
    WebView,
    AsyncStorage,
    Modal,
    DeviceEventEmitter,
    Switch,
    Platform,
    Dimensions,
    RefreshControl,
    Alert


} from  'react-native';


import YQFNavBar from '../../components/yqfNavBar';
import Colors from '../../Themes/Colors';


import {Chat} from '../../utils/chat';
import  ChatList from '../Chat/ChatList'

const window = {

    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,

}

class profitTestModel extends Component {


    @observable showBack =false;
    @observable loading = true;
    @observable loadingText = "正在加载数据..."
    @observable RowCount = 0;
    @observable UserPosterList = [];
    @observable lev_SelectUserCode = "";//被选中的对应的下级UserCode。默认以第一个为标准
    @observable lev__Array = [];//下下级的数据。有可能当前登录用户没有下下级，则不用考虑这个问题


}




//将这个页面需要用到的颜色抽取出来，估计经常需要用到




@observer
export  default  class profitTest extends Component{

    constructor(props){

        super(props);


        this.store = new profitTestModel();

        if(props.showBack){

            this.store.showBack = props.showBack;
        }

    }



    componentDidMount = () =>{

        //处理初始化信息。  关于 lev_SelectIndex 的问题，以及lev__Array 的问题

        /**
         *
         * 如果有下下级的话，则默认以第一个下级为选中状态。并将第一个下级下面的下下级全部加入到lev__Array 里面去。
         * 后面如果有点击的话，则修改对应的selectIndex值
        */

        if (this._mapIsExists(2)){

            var select_UserCode = this._getArrayByLev(1)[0].UserCode;

            this.store.lev_SelectUserCode = select_UserCode;

            var top__Array = this._getArrayByLev(2)

            var tempArray =[]
            for(i=0;i<top__Array.length;i++){
                if(top__Array[i].TeamLeaderUserCode == select_UserCode){
                    tempArray.push(top__Array[i])
                }
            }

            this.store.lev__Array = tempArray


        }



    }


    //刷新当前数据
    _refreshData = async() =>{

        Chat._TeamPriceAnalysisd();


    }



    _renderNav() {

        //是否要显示打勾

        if(this.store.showBack){

            return (
                <YQFNavBar title={'团队毛利和提成'}
                           leftIcon={'0xe183'}
                           rightText={'刷新'}
                           onRightClick={()=>{
                              this._refreshData()
                           }}
                           onLeftClick={() => {
                               this.props.navigator.pop()
                           }}/>

            )
        }else {

            return (
                <YQFNavBar
                    rightText={'刷新'}
                    onRightClick={()=>{
                        this._refreshData()
                    }}
                    title={'团队毛利和提成'}/>

            )
        }


    }

    _getArrayByLev = (lev) =>{

        return Chat.obj.lev[lev]

    }


    _mapIsExists = (lev)=>{

        /*
        //如果存在这个key，而且对应的value大于0，则可以显示出来。而且必须满足这个数据的第一项的TeamLeaderUserCode的长度大于0，有可能dicky登录，没有上级
        if(Chat.obj.lev && Chat.obj.lev[lev] && Chat.obj.lev[lev].length>0 && Chat.obj.lev[lev][0].TeamLeaderUserCode.length>0){

            return true
        }
        */

        if(Chat.obj.lev && Chat.obj.lev[lev] && Chat.obj.lev[lev].length>0){

            return true
        }



        return false





    }


    _renderLev2 = ()=>{
        if(this._mapIsExists(2)){

            var topArray = this.store.lev__Array;

            return(

                <View style={{flexDirection:'row'}}>

                    <ScrollView  horizontal={true}>

                    <View
                        style={{flexDirection:'row',flex:1}}>

                        {

                            topArray.map((data)=>{

                                return  this.renderInfo(data,2)
                            })

                        }



                    </View>
                </ScrollView>

                </View>
            )

        }

        return null


    }


    _renderLev1 = ()=>{
        if(this._mapIsExists(1)){

            var topArray = Chat.obj.lev["1"];
            return(

                <View style={{flexDirection:'row'}}>

            <ScrollView  horizontal={true}>

                    <View style={{flexDirection:'row',flex:1}}>
                        {
                            topArray.map((data)=>{
                                return  this.renderInfo(data,1)
                            })

                        }
                    </View>
                </ScrollView>
                </View>
            )

        }

        return null


    }

    _renderLev = ()=>{

        if(this._mapIsExists(0)){

            var topArray = Chat.obj.lev["0"];


            return(

                <View style={{flexDirection:'row'}}>

                    <ScrollView     horizontal={true}>

                <View
                    style={{flexDirection:'row',flex:1}}>
                    {
                        topArray.map((data,i)=>{

                               return  this.renderInfo(data,0,i)
                        })
                    }
                </View>
                </ScrollView>
                </View>

            )

        }

        return null

    }

    _renderLev_ = ()=>{

        if(this._mapIsExists(-1)){

            var top_Array = Chat.obj.lev["-1"];

            // console.log("_renderLev_ === topArray")
            // console.dir(top_Array)

            return(


            <View style={{flexDirection:'row'}}>

                <ScrollView     horizontal={true}>
                    <View
                        style={{flexDirection:'row',flex:1}}>
                        {
                            top_Array.map((data)=>{

                                return  this.renderInfo(data,-1)
                            })
                        }
                    </View>
                </ScrollView>
            </View>
            )

        }

        return null

    }

    _renderLev__ = ()=>{

        if(this._mapIsExists(-2)){

            var top__Array = Chat.obj.lev["-2"];
            var data = top__Array[0]

            // console.log("_renderLev__ === topArray")
            // console.dir(top__Array)


            return(

                <View style={{flexDirection:'row'}}>



                    <ScrollView     horizontal={true}>
                        <View
                            style={{flexDirection:'row',flex:1}}>
                            {
                                top__Array.map((data)=>{

                                    return  this.renderInfo(data,-2)
                                })
                            }
                        </View>
                    </ScrollView>
                </View>

            )

        }

        return null
    }


    //渲染每一级别的个人信息
    renderInfo = (data,lev,index) =>{

        var margin=10;
        var ImageW = 60;
        var uri = "http://3g.yiqifei.com/userimg/"+data.UserCode+"/5"

        var TotalAmount=data.TotalAmount;//营业额

        var NetGrossProfitAmountTotal=data.NetGrossProfitAmountTotal;//毛利

         var today = new Date();
         timeStr =   Chat._ChangeDateToString(today)

        //这里需要确认一下，如果是自己为主角的话，则
        /**
         * 如果lev == 0，则代表为主角那一级别的。则颜色，字体都要跟着修改
         * 如果lev == 1，则代表下级。如果点击选中了那个人，则背景颜色啊什么的都要修改
         * */
        var backgroundColor,nameColor,timeColor,lineColor,  totalAmountColor,NetGrossProfitAmountTotalColor,avatarBorderColor;
        var containerBoderColor= "rgb(238,238,238)";

        var viewWidth = window.width/3;
        if(lev == 0) {




            //当前登录人
            if (data.UserCode == Chat.obj.testUserCode) {
                backgroundColor = '#62BC87';
                nameColor = "#fff";
                timeColor = "#fff";
                lineColor = "#fff";
                totalAmountColor = "#fff";
                NetGrossProfitAmountTotalColor = "#fff";
                avatarBorderColor = "#fcb761";
                containerBoderColor = "#fcb761";


            }else{

                //当前登录的同一级别的兄弟...
                backgroundColor = '#fff';
                nameColor = "#333";
                timeColor = "#999";
                lineColor = "#999";
                totalAmountColor = "#666";
                NetGrossProfitAmountTotalColor = "#666";
                avatarBorderColor = "#fff";

                //#TODO 20180906 Morton新需求 将毛利提成过滤成对应的****.**

                // console.log("同一级别的同事 data.TotalAmount====",data.TotalAmount)
                // console.log("同一级别的同事 data.NetGrossProfitAmountTotal====",data.NetGrossProfitAmountTotal)

                TotalAmountStr = String(data.TotalAmount)
                NetGrossProfitAmountTotalStr = String(data.NetGrossProfitAmountTotal)

                // console.log("TotalAmountStr====",TotalAmountStr)
                // console.log("NetGrossProfitAmountTotalStr====",NetGrossProfitAmountTotalStr)

                TotalAmount =   TotalAmountStr.replace(/[\d]/g,function (num) {
                    return " *";
                })
                NetGrossProfitAmountTotal =  NetGrossProfitAmountTotalStr.replace(/[\d]/g,function (num) {
                    return " *";
                })

            }
        }else if(lev == 1){

            if (data.UserCode == this.store.lev_SelectUserCode) {
                backgroundColor = 'rgb(215,234,222)';
                nameColor = "#333";
                timeColor = "#999";
                lineColor = "#fff";
                totalAmountColor = "#666";
                NetGrossProfitAmountTotalColor = "#666";
                avatarBorderColor = "#fff";
                containerBoderColor  = "#ffdfb2";

            }else{

                backgroundColor = '#fff';
                nameColor = "#333";
                timeColor = "#999";
                lineColor = "#999";
                totalAmountColor = "#666";
                NetGrossProfitAmountTotalColor = "#666";
                avatarBorderColor = "#fff";

            }
        }else if(lev == 2){

                backgroundColor = '#eff7f2';
                nameColor = "#333";
                timeColor = "#999";
                lineColor = "#999";
                totalAmountColor = "#666";
                NetGrossProfitAmountTotalColor = "#666";
                avatarBorderColor = "#fff";

        } else {

            backgroundColor = '#fff';
            nameColor = "#333";
            timeColor = "#999";
            lineColor = "#999";
            totalAmountColor = "#666";
            NetGrossProfitAmountTotalColor = "#666";
            avatarBorderColor = "#fff";

        }




        var viewStyle={
           flex:1,  width:viewWidth, borderRadius:5, backgroundColor:backgroundColor,padding:margin,borderColor:containerBoderColor,borderWidth:2  }

        var nameStyle={
            fontSize:16,color:nameColor,margin:margin/2,marginTop:ImageW/2
        }
        var timeStyle={
            fontSize:13,color:timeColor,marginLeft:margin/2
        }
        var lineStyle={
            backgroundColor:lineColor,height:1, margin:margin/2,flex:1
        }

        var totalAmountStyle = {
            fontSize:13,color:totalAmountColor,marginLeft:margin/2
        }
        var NetGrossProfitAmountTotalStyle={
            fontSize:13,color:NetGrossProfitAmountTotalColor,marginLeft:margin/2
        }

        var avatarStyle={
            width:ImageW,height:ImageW,borderRadius:ImageW/2,borderColor:avatarBorderColor,borderWidth:3
        }

        return(

            <View style={{}} key={index}>

                <TouchableOpacity style={{margin:margin,flex:1,marginTop:ImageW/2}} onPress={()=>{
              this._ClickItem(data,lev)
            }}>
                <View style={viewStyle}>

                    <Text  numberOfLines={1} style={nameStyle}>{data.StaffName}</Text>
                    <Text  numberOfLines={1} style={timeStyle}>{timeStr}</Text>
                    <View style={lineStyle}></View>
                    <Text numberOfLines={1} style={totalAmountStyle}>{"营业额: "+TotalAmount}</Text>
                    <Text  numberOfLines={1} style={NetGrossProfitAmountTotalStyle}>{"毛利: "+NetGrossProfitAmountTotal}</Text>
                </View>

               </TouchableOpacity>


                <TouchableOpacity onPress={()=>{

                    //跳转到用户详情界面
                    this._JumpToDetail(data)

                }} style={{position:'absolute',top:0,left:(viewWidth+margin*2-ImageW)/2}}>


                    <Image style={avatarStyle} source={{uri:uri}}>

                    </Image>

                    <Image source={lev==-2 || lev==-1 ? require('../../image/huangguan.png') : lev==1 || lev==2? require('../../image/star.png') : require('../../image/Diamond.png') }
                           style={{position:'absolute',bottom:0,right:0,width:15,height:15,alignItems:"center"}}>
                    </Image>

                    {
                        data.UserCode == Chat.obj.testUserCode && Chat.obj.totalUnReadMessage >0 ?

                            <View style={{position:'absolute',top:2,right:-2,width:24,height:24,borderRadius:12,overflow:"hidden", backgroundColor:"red",justifyContent:"center", alignItems:"center"}}>
                                <Text style={{color:'#fff',fontSize:13}}>{ Chat.obj.totalUnReadMessage >=100? 99 : Chat.obj.totalUnReadMessage}</Text>
                            </View>
                            :
                            null

                    }


                </TouchableOpacity>




                <View style={{position:'absolute',top:0,right:0,alignItems:"center",}}>
                {
                    lev ==0 ? null
                        :
                        <View style={{justifyContent:'center',alignItems:"center", position:'absolute',top:0,right:margin,backgroundColor:"#149F7C",width:25,height:18,borderRadius:4}}>
                            <Text style={{color:"#fff",fontSize:15,fontWeight:'bold'}}>{this._getLogByLev(lev)}</Text>
                        </View>

                }
               </View>





            </View>



        )

    }




    _getLogByLev = (lev)=>{

        var log;
        if(lev==-2){
            log = "++"
        }else  if(lev==-1){
            log = "+"
        }else  if(lev==1){
            log = "-"
        }else  if(lev==2){
            log = "--"
        }else{
            log = " "
        }
        return log

    }


    _JumpToDetail =async (data) =>{


        //如果是自己的账号的话，则跳转到消息列表
        if(data.UserCode == Chat.obj.testUserCode){

            this.props.navigator.push({

                component:ChatList,
                passProps:{
                   showBack:true
                }
            })

        }else{

            //#TODO 这里暂时写死，将其直接跳到聊天对话。现在这里使用1111这个账号写死
            Chat.createConversation(this.props.navigator,data.IMNr,data.StaffName,'C2C');



            /*
            //CRM.AccountInfoByUserCode 根据用户代码或人代码获取账号相关信息
            var AccountInfoByUserCodeParam={
                UserCodes:data.UserCode
            }

            var  AccountInfoByUserCodeResult = await ServingClient.execute('CRM.AccountInfoByUserCode',AccountInfoByUserCodeParam);
            if(AccountInfoByUserCodeResult && AccountInfoByUserCodeResult.AccountInfos &&  AccountInfoByUserCodeResult.AccountInfos.length>0){

                var AccountInfos = AccountInfoByUserCodeResult.AccountInfos[0];

                var PersonCode = AccountInfos.PersonCode
                var Name = AccountInfos.PersonName
                var Gender = AccountInfos.Sex


                var  createUserParam ={
                    UserCode:data.UserCode,
                    StaffCode:PersonCode,
                    Name:Name,
                    Gender:Gender,
                    RoleType:"INCU"
                };

                console.log("制造的参数====",createUserParam)

                var result = await ServingClient.execute('IM.CreateUser',createUserParam);

                console.log("点击的这个的信息详情====",result)

                this.props.navigator.push({

                    component:ChatUserInfo,
                    passProps:{
                        Peer:result.User.IMNr,
                        User:result.User,
                    }
                })
            }
            */




        }







    }

    _ClickItem = (data,lev) =>{

        //点击了我的下级(有可能没有下级)
        if (lev == 1 && this._mapIsExists("2")){

            //拿出点击的这个值的UserCode
            var lev__ = Chat.obj.lev["2"]

            if (lev__ && lev__.length>0){

                var tempArray=[]
                for(i=0;i<lev__.length;i++){
                    if(lev__[i].TeamLeaderUserCode == data.UserCode){
                        tempArray.push(lev__[i])
                    }
                }



                this.store.lev_SelectUserCode = data.UserCode;
                this.store.lev__Array = tempArray



            }
        }

    }



    //渲染每一级别的logo
    renderLog = (lev) =>{

        var log;
        if(lev==-2){
            log = "++"
        }else  if(lev==-1){
            log = "+"
        }else  if(lev==1){
            log = "-"
        }else  if(lev==2){
            log = "--"
        }else{
            log = " "
        }

        var margin = 5;

        //alignItems:'flex-end'则图标往下走，，flex-start 往上走
            return(

                <View style={{flexDirection:'row', margin:margin,backgroundColor:'#159E7D',alignItems:'center',width:40,height:30}}>
                    <Icon size={20} icon={'0xe17a'} color={'#fff'}/>
                    <Text style={{fontSize:15,color:'#fff'}}>{log}</Text>

                </View>

            )




    }


    renderLoading = ()=>{


        if(Chat.obj.levLoading){

            return <ActivityIndicator toast text={'加载毛利和提成...'} animating={Chat.obj.levLoading}/>

        }
        return null;



    }



    render() {

        return (

            <View style={{backgroundColor: 'rgb(240,240,240)', flex: 1}}>

                {this._renderNav()}




                {
                    Chat.obj.lev && Chat.obj.lev["0"] ?

                        <ScrollView style={{backgroundColor: 'rgb(240,240,240)'}}>
                            {this._renderLev__()}
                            {this._renderLev_()}
                            {this._renderLev()}
                            {this._renderLev1()}
                            {this._renderLev2()}
                        </ScrollView>

                        :
                        null

                }


                {this.renderLoading()}



            </View>

        );

    }

}


