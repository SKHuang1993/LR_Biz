import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet,
	View,
    Text,
    Dimensions,
    ListView,
    TouchableOpacity,
    Platform,
    BackHandler,
    Alert,
    NativeModules,
} from 'react-native';
import {Toast} from 'antd-mobile';
import Icon from '../../../components/icons/icon';
import Icon2 from '../../components/icon';
import {COLORS} from '../../styles/commonStyle';
import{ RestAPI,ServingClient } from '../../utils/yqfws'
import MyOrderDetail from './myOrderDetail';
import MyWebView from './webview';
import PayLink from './payLink';
import {Chat} from '../../utils/chat';
var {width,height} = Dimensions.get('window')
import { BaseComponent,} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var _num = 0;

export default class OrderModuleView extends Component {
    static propTypes = {
        itemInfo:PropTypes.object,//每张订单的信息
	}

    constructor(props) {
        super(props);
        this.state={
            imgType:2,
            userImg:"",
            isTrain:false,
            changeSuccess:false,
            moduleInfo:{},//每张订单的信息
            dataSource:new ListView.DataSource({
                rowHasChanged: (row1, row2) => row1 !== row2,
            }),
            tripInfoList:new ListView.DataSource({
                rowHasChanged: (row1, row2) => row1 !== row2,
            }),
            serviceStaffInfo:{},
            orderId:'',
            isCancel:false,
            LoginAccount:'',
            AccountNo:this.props.AccountNo,
            isGo:false,
            isBack:false,
            isChangeReturn:false,
            passengersName:'',
        };
    }

    componentDidMount(){
    }

    render(){
        this.state.moduleInfo = this.props.itemInfo;
        this.state.orderId = this.props.itemInfo.SOShortNr;
        this.state.passengersName = this.props.itemInfo.BookerName;
        // if(this.props.itemInfo.ProductSalesOrders[0].ProductCategoryID == 8)
        //     this.isCanChangeOrReturn();
        this.state.serviceStaffInfo = {
            'UserCode':this.props.itemInfo.ServiceStaff.UserCode,
            'Name':this.props.itemInfo.ServiceStaff.Name,
            'CustomerServiceCount':'768',
            'UserAVGScore':this.props.itemInfo.ServiceStaff.UserAVGScore,
            'Mobile':this.props.itemInfo.ServiceStaff.Mobile,
            'WXQRCode':this.props.itemInfo.ServiceStaff.WXQRCode,
            'IsOnline':this.props.itemInfo.ServiceStaff.IsOnline,
            'IsMobileOnline':this.props.itemInfo.ServiceStaff.IsMobileOnline,
            'userImg':"http://m.woquguo.net/UserImg/" + this.props.itemInfo.ServiceStaff.UserCode + "/3",
            'IMNr':this.props.itemInfo.ServiceStaff.IMNr?this.props.itemInfo.ServiceStaff.IMNr:'',
        };
        let _order = [this.props.itemInfo.ProductSalesOrders[0]];
        for(var i = 1;i<this.props.itemInfo.ProductSalesOrders.length;i++){
            let len = 0
            for(var j=0;j<_order.length;j++){
                if(_order[j].FirstDepartureDate == this.props.itemInfo.ProductSalesOrders[i].FirstDepartureDate&&
                    _order[j].LastArrivalDate == this.props.itemInfo.ProductSalesOrders[i].LastArrivalDate&&
                    _order[j].Intro == this.props.itemInfo.ProductSalesOrders[i].Intro){len++;}
            }
            if(len==0){
                _order.splice(_order.length, 0, this.props.itemInfo.ProductSalesOrders[i]);
            }
        }
        this.props.itemInfo.Orders = _order;
        let ds = new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
        });
        this.state.dataSource = ds.cloneWithRows(this.props.itemInfo.Orders);
        this.state.tripInfoList = ds.cloneWithRows(this.props.itemInfo.Orders);
        let returnCount = 0;
        let changeCount = 0;
        let pasCount = 0;
        if((this.props.itemInfo.ProductSalesOrders[0].ProductCategoryID == 2 || 
            this.props.itemInfo.ProductSalesOrders[0].ProductCategoryID == 3 ||
            this.props.itemInfo.ProductSalesOrders[0].ProductCategoryID == 8 ||
            this.props.itemInfo.ProductSalesOrders[0].ProductCategoryID == 9) && 
                (this.props.itemInfo.ProductSalesOrders[0].CustomerDocStatusID == 1|| 
                    this.props.itemInfo.ProductSalesOrders[0].CustomerDocStatusID == 6||
                    this.props.itemInfo.ProductSalesOrders[0].CustomerDocStatusID == 21|| 
                    this.props.itemInfo.ProductSalesOrders[0].CustomerDocStatusID == 22|| 
                    this.props.itemInfo.ProductSalesOrders[0].CustomerDocStatusID == 2 || 
                    this.props.itemInfo.ProductSalesOrders[0].CustomerDocStatusID == 23 || 
                    this.props.itemInfo.ProductSalesOrders[0].CustomerDocStatusID == 3 || 
                    this.props.itemInfo.ProductSalesOrders[0].CustomerDocStatusID == 15)
                 && this.props.itemInfo.BookerID == this.props.AccountNo)
                this.state.isCancel = true;
        else this.state.isCancel = false;
        for(var v of this.props.itemInfo.ProductSalesOrders){
            if(v.ProductCategoryID == 3 && (v.CustomerDocStatusID == 11||v.CustomerDocStatusID == 48||
                v.CustomerDocStatusID == 49)) this.state.isTrain = true;
            else this.state.isTrain = false;
            if(v.ProductCategoryID == 3 && v.CustomerDocStatusID == 18) this.state.changeSuccess = true;
            if(v.CustomerDocStatusID == 18 || v.CustomerDocStatusID == 17) changeCount++;
            if(v.CustomerDocStatusID == 19 || v.CustomerDocStatusID == 20) returnCount++;
            if(v.PSOShortNr.indexOf(".")<1) pasCount++;
            
        }
        return(
            <View style={{marginBottom:12,marginTop:3}}>
                <View style={styles.titleViewStyle}>
                    <Text style={{fontSize:16,color:"#333",flex:1,fontWeight:'bold'}}>
                        {this.state.moduleInfo.ProductSalesOrders[0].ProductCategoryCName}
                    </Text>
                    <Text style={{fontSize:15,color:"#666",}}>{lan.orderNum+":"+this.state.orderId}</Text>
                </View>
                
                <ListView
                    enableEmptySections = {true}
                    dataSource={this.state.dataSource}
                    renderRow={(rowData,sectionID,rowID)=>this.productInfo(rowData,rowID)}
                />
                <View style={styles.priceViewStyle}>
                    <Text style={{flex:1,textAlign:'right',color:'#666',fontSize:12}}>{this.getProductPrice()}</Text>
                    <Text style={{fontSize:16,color:'#333',marginLeft:8}}>付票价：</Text>
                    <Text style={{fontSize:15,color:COLORS.btnBg}}>¥</Text>
                    <Text style={{fontSize:18,color:COLORS.btnBg}}>{this.state.moduleInfo.TotalAmount}</Text>
                </View>
                <View style={{backgroundColor:'#ebebeb',height:0.8}}></View>
                <View style={styles.titleViewStyle}>
                    <Text style={{flex:1}}></Text>

                    {this.state.moduleInfo.IsPayable ? 
                    <TouchableOpacity style={styles.checkOrderBorderStyle} onPress={()=>this.toPayOrder(this.state.orderId,this.state.moduleInfo.TotalAmount)}>
                        <Text style={{color:COLORS.btnBg}}>{'支付链接'}</Text>
                    </TouchableOpacity>
                    : null}

                    <TouchableOpacity style={styles.checkOrderBorderStyle} onPress={()=>this.callPhoneEvent(this.state.moduleInfo.ContactMobile)}>
                        <Text style={{color:'#333'}}>{'联系客户'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.checkOrderBorderStyle} onPress={()=>{this.createTripOrder()}}>
                        <Text style={{color:'#333'}}>{'行程单'}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={{marginLeft:10}} onPress={()=>this.toOrderDetail()}>
                        <Text style={{color:'#159E7D',fontSize:16}}>更多 ></Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    //8-国内机票，9-国际机票，2-酒店，5-签证，4-保险
    productInfo = (value,i) => {
        if(value.ProductCategoryID == 8 || value.ProductCategoryID == 9) {
            return this.planeTicketView(value);
        }else if(value.ProductCategoryID == 2){
            return this.hotelView(value);
        }else if(value.ProductCategoryID == 4){ 
            return this.insuranceView(value);
        }else if(value.ProductCategoryID == 5){ 
            return this.visaView(value);
        }else if(value.ProductCategoryID == 796){ 
            return this.phoneCadeView(value);
        }else{
            return this.trainTicketView(value);
        }
    }

    planeTicketView = (info) => {
        let departureDate_time = info.FirstDepartureDate?info.FirstDepartureDate.substring(0,16).replace("T"," "):"";
        return(
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                                alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe660'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8}}>{info.Intro.replace(/\-/g,"→")}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{lan.departureDate+":"+departureDate_time}</Text>
                    <Text style={{color:'#666',marginLeft:32,marginTop:2}}>{"下单时间:"+(info.CreateDate?info.CreateDate.substring(0,16).replace("T"," "):"")}</Text>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}} numberOfLines={1}>{"下单人："+this.state.passengersName}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10'}}>{info.LatestDocStatusCName}</Text>
            </View>
        );
    }

    hotelView = (info) => {
        return(
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe661'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8,width:width-158}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.FirstDepartureDate?info.FirstDepartureDate.replace("T"," "):""}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10'}}>{info.LatestDocStatusCName}</Text>
            </View>
        );
    }

    trainTicketView = (info) => {
        return(
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe662'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.FirstDepartureDate?info.FirstDepartureDate.replace("T"," "):""}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10'}}>{info.LatestDocStatusCName}</Text>
            </View>
        );
    }

    insuranceView = (info) =>{
        return(
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe697'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8,width:width-158}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.FirstDepartureDate}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10',width:80,textAlign:'right'}}>{info.LatestDocStatusCName}</Text>
            </View>
        );
    }

    visaView = (info) => {
        return(
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe696'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8,width:width-158}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.FirstDepartureDate}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10'}}>{info.LatestDocStatusCName}</Text>
            </View>
        );
    }

    phoneCadeView = (info) =>{
        return(
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon2 icon={'0xe6c6'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8,width:width-158}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.FirstDepartureDate}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10',width:80,textAlign:'right'}}>{info.LatestDocStatusCName}</Text>
            </View>
        );
    }

    //获取跟单人头像
    getUserImg=()=>{
            let param={
                "UserCode": this.state.serviceStaffInfo.UserCode,
            }
            RestAPI.invoke("CRM.TravelAdvisoryInfoStatistics",JSON.stringify(param),(value)=>{
                let advInfo = value;
                if(advInfo.Code == 0){
                    this.state.serviceStaffInfo = {
                        'UserCode':this.state.serviceStaffInfo.UserCode,
                        'Name':this.state.serviceStaffInfo.Name,
                        'CustomerServiceCount':advInfo.Result.CustomerServiceCount!=null?advInfo.Result.CustomerServiceCount:768,
                        'UserAVGScore':this.state.serviceStaffInfo.Name.UserAVGScore,
                        'Mobile':this.state.serviceStaffInfo.Mobile,
                        'WXQRCode':this.state.serviceStaffInfo.WXQRCode,
                        'IsOnline':this.state.serviceStaffInfo.IsOnline,
                        'IsMobileOnline':this.state.serviceStaffInfo.IsMobileOnline,
                        'userImg':"http://m.woquguo.net/UserImg/" + this.state.serviceStaffInfo.UserCode + "/3",
                    }
                    this.getIMNr();
                }else{
                    Toast.info(value, 3, null, false);
                }
            },(err)=>{
                Toast.info(err,3,null,false);
            })
    }

    //获取IMNr
    getIMNr = () =>{
        let param = {
            "UserCode": this.state.serviceStaffInfo.UserCode,
            "UserName": null,
            "Password": null,
            "Platform": "MobileDevice",
            "Source": "差旅宝"
        }
        ServingClient.invoke("IM.GetToken",param,(value) => {
            if(value.IsSuccess){
                this.state.serviceStaffInfo.IMNr = value.User.IMNr;
                this.props.itemInfo.ServiceStaff.IMNr = value.User.IMNr;
            }
        });
    }

    chatWithAdviser = () => {
        Chat.createConversation(this.props.navigator,this.state.serviceStaffInfo.IMNr,this.state.serviceStaffInfo.Name,"C2C",null);
    }

    //获取单个产品价格
    getProductPrice = () => {
        let con = '(';
        for (var value of this.props.itemInfo.Orders) {  
            if(value.ProductCategoryID == 8 || value.ProductCategoryID == 9) con = con+lan.flights+":¥"+value.TotalAmount+" ";
            else if(value.ProductCategoryID == 2) con = con+lan.hotel+":¥"+value.TotalAmount+" ";
            else if(value.ProductCategoryID == 4) con = con+lan.insurance+":¥"+value.TotalAmount+" ";
            else if(value.ProductCategoryID == 5) con = con+lan.visa+":¥"+value.TotalAmount+" ";
            else con = con+lan.trains+":¥"+value.TotalAmount+" ";
        }
        con = con.substring(0,con.length-1)+")";
        return con;  
    }

    //支付链接
    toPayOrder = (orderId,totalAmount) =>{
        this.props.navigator.push({
            name: 'PayLink',
            component: PayLink,
            passProps: {
                OrderID: orderId,
                AccountNo: this.state.AccountNo,
                PayMoney: totalAmount
            }
        })
    }

    //跳转生成行程单
    createTripOrder = () =>{
        this.props.navigator.push({
            name: 'MyWebView',
            component: MyWebView,
            passProps: {
                webUrl:"http://mlr.yiqifei.com/Itinerary?pnr="+this.state.orderId+"&mid="+
                    Chat.loginUserResult.SignInInfos[0].UserNr+"&VersionNr=0&Language=CN",
                Title:'行程单',
                AccountNo:this.state.AccountNo
            }
        })
    }

    //查看订单详情
    toOrderDetail = () =>{
        const {navigator} = this.props;
        if(navigator) {
            navigator.push({
                name: 'MyOrderDetail',
                component: MyOrderDetail,
                passProps:{
                    OrderId:this.state.orderId,
                    BookerID:this.props.itemInfo.BookerID,
                    LoginAccount:this.state.LoginAccount,
                    AccountNo:this.props.AccountNo,
                    IsApproval:false,
                    RefreshEvent:()=>this.props.RefreshEvent()
                }
            });
        }
    }

    //拨打营业员电话
    callPhoneEvent=(phoneNum)=>{
        Alert.alert(
            lan.call,
            phoneNum,
            [
              {text: lan.ok, onPress: () => NativeModules.MyNativeModule.callPhone(phoneNum)},
              {text: lan.cancel, onPress: () => console.log('Cancel Pressed!',phoneNum)},
            ]
          )
    }

}

const styles = StyleSheet.create({
    titleViewStyle:{
        flexDirection:'row',
        backgroundColor:"#fff",
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft:15,
        paddingRight:15,
        paddingTop:10,
        paddingBottom:8,
    },
    itemViewStyle:{
        backgroundColor:'#fff',
        flexDirection:'row',
        paddingLeft:15,
        paddingRight:15,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom:10,
        width:width
    },
    contactViewStyle:{
        flexDirection:'row',
        backgroundColor:"#f7f7f7",
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft:15,
        paddingRight:15,
        paddingTop:10,
        paddingBottom:10,
    },
    priceViewStyle:{
        flexDirection:'row',
        backgroundColor:"#fff",
        alignItems:'flex-end',
        justifyContent: 'center',
        paddingRight:15,
        paddingBottom:10,
    },
    checkOrderBorderStyle:{
        marginLeft:8,
        backgroundColor:'#ebebeb',
        borderRadius:20,
        width:80,
        height:30,
        alignItems:'center',
        justifyContent:'center'
    },
    payBorderStyle:{
        marginLeft:15,
        borderColor:COLORS.btnBg,
        borderRadius:5,
        borderWidth:0.5,
        padding:5,
    },
})