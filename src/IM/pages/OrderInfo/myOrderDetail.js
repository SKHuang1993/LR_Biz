import React, { Component } from 'react';
import {ScrollView,View,Text,Dimensions,ListView,TouchableOpacity,StyleSheet,Alert} from 'react-native';
import Icon from '../../../components/icons/icon';
import Icon2 from '../../components/icon';
import { Toast } from 'antd-mobile';
import YQFNavBar from '../../components/yqfNavBar';
import { RestAPI,ServingClient } from '../../utils/yqfws';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { COLORS } from '../../styles/commonStyle';
import CreditPayment from './creditPayment';
import SubmitOrder from './submitOrder';
import OrderDetail from './orderDetail';
import ContactOrganization from '../Contact/ContactOrganization';
import Main from '../../index';
import WebView from '../../components/webview1';
import MyWebView from './webview';
import PayRecord from './payRecord';
import PayLink from './payLink';
import {Chat} from '../../utils/chat';
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var { width, height } = Dimensions.get('window')
export default class MyOrderDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSource:new ListView.DataSource({
                rowHasChanged: (row1, row2) => row1 !== row2,
            }),
            remarksSource:new ListView.DataSource({
                rowHasChanged: (row1, row2) => row1 !== row2,
            }),
            remarksData:[],//订单备注数据
            passengersName:'',//乘客名字
            orderInfo:{},
            BookerIMNr:"",
        }
    }

    componentDidMount() {
        this.getOrderDetailInfo();
    }

    //返回首页
    toMain = () => {
        this.props.navigator.replace({
            name: 'Main',
            component: Main,
            passProps: {
            }
        })
    }

    render() {
        return(
            <View style={{width:width,height:height,backgroundColor:'#ebebeb'}}>
                <YQFNavBar navigator={this.props.navigator} title={lan.orderDetail}
                    leftIcon={'0xe183'} rightIcon={'0xe667'} Icon2={true}
                    onLeftClick={()=>{this.props.navigator.pop();}} 
                    onRightClick={() => this.toMain()}
                />
                <ScrollView style={{padding:10,flex:1}}>
                    <TouchableOpacity style={{width:width-20,padding:10,backgroundColor:'#fff',marginBottom:1,
                        flexDirection:'row'}} onPress={()=>{this.toOrderDetail()}}>
                        <Text style={{fontSize:15,color:COLORS.link,flex:1}}>订单明细</Text>
                        <Icon2 icon={'0xe177'} color={'#666'} size={18} />
                    </TouchableOpacity>
                        <ListView
                            enableEmptySections = {true}
                            dataSource={this.state.dataSource}
                            renderRow={(rowData,sectionID,rowID)=>this.productInfo(rowData,rowID)}
                        />
                    <View style={{width:width-20,padding:10,backgroundColor:'#fff',marginBottom:1,
                        flexDirection:'row',marginTop:10,paddingBottom:13,paddingTop:13,borderTopLeftRadius:8,
                        borderTopRightRadius:8}}>
                        <Text style={{fontSize:16,color:"#999",flex:2.2}}>订票人</Text>
                        <Text style={{fontSize:16,color:"#333",flex:4}}>{this.state.orderInfo.BookerName}</Text>
                        <Icon2 icon={'0xe16b'} color={'#159E7D'} size={20} onPress={()=>{this.toChatWithBooker()}}/>
                        <Icon2 icon={'0xe6c6'} color={'#159E7D'} size={20} style={{marginLeft:20,marginRight:15}}
                            onPress={()=>{this.callPhoneEvent(this.state.orderInfo.ContactMobile)}}/>
                    </View>
                    <View style={{width:width-20,padding:10,backgroundColor:'#fff',marginBottom:1,
                        flexDirection:'row',paddingBottom:13,paddingTop:13}}>
                        <Text style={{fontSize:16,color:"#999",flex:1.5}}>手机</Text>
                        <Text style={{fontSize:16,color:"#333",flex:4}}>{this.state.orderInfo.ContactMobile}</Text>
                    </View>
                    <View style={{width:width-20,padding:10,backgroundColor:'#fff',flexDirection:'row',
                        paddingBottom:13,paddingTop:13,borderBottomLeftRadius:8,borderBottomRightRadius:8}}>
                        <Text style={{fontSize:16,color:"#999",flex:1.5}}>邮箱</Text>
                        <Text style={{fontSize:16,color:"#333",flex:4}}>{this.state.orderInfo.ContactEmail}</Text>
                    </View>
                    <View style={{width:width-20,padding:10,backgroundColor:'#fff',marginBottom:1,alignItems:'center',
                        flexDirection:'row',marginTop:10,paddingBottom:13,paddingTop:13,borderTopLeftRadius:8,
                        borderTopRightRadius:8}}>
                        <Text style={{fontSize:16,color:"#999",flex:2.2}}>订单编号</Text>
                        <Text style={{fontSize:16,color:"#333",flex:4}}>{this.state.orderInfo.TradeID}</Text>
                        <TouchableOpacity style={{width:70,height:32,alignItems:'center',justifyContent:'center',
                            borderWidth:.7,borderColor:COLORS.link,borderRadius:20}}
                            onPress={()=>{this.toPayRecord()}}>
                            <Text style={{fontSize:13,color:COLORS.link}}>支付记录</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{width:width-20,padding:10,backgroundColor:'#fff',marginBottom:1,
                        flexDirection:'row',paddingBottom:13,paddingTop:13}}>
                        <Text style={{fontSize:16,color:"#999",flex:1.5}}>下单时间</Text>
                        <Text style={{fontSize:16,color:"#333",flex:4}}>{this.state.orderInfo.CreateTime?
                            this.state.orderInfo.CreateTime.substring(0,16).replace("T"," "):''}</Text>
                    </View>
                    <View style={{width:width-20,padding:10,backgroundColor:'#fff',marginBottom:1,
                        flexDirection:'row',paddingBottom:13,paddingTop:13}}>
                        <Text style={{fontSize:16,color:"#999",flex:1.5}}>订单来源</Text>
                        <Text style={{fontSize:16,color:"#333",flex:4}}>{this.state.orderInfo.SourceName}</Text>
                    </View>
                    <View style={{width:width-20,padding:10,backgroundColor:'#fff',flexDirection:'row',
                        justifyContent:'flex-end',alignItems:'flex-end',
                        paddingBottom:13,paddingTop:13,borderBottomLeftRadius:8,borderBottomRightRadius:8}}>
                        <Text style={{fontSize:12,color:"#666",marginRight:5}}>{this.state.orderInfo.Orders?this.getProductPrice():''}</Text>
                        <Text style={{fontSize:15,color:"#333"}}>付票价：</Text>
                        <Text style={{fontSize:13,color:COLORS.btnBg}}>¥</Text>
                        <Text style={{fontSize:18,color:COLORS.btnBg}}>{this.state.orderInfo.TotalAmount}</Text>
                    </View>
                    {this.state.remarksData.length>0?
                    <View style={{backgroundColor:'#fff',marginTop:15,padding:5,borderRadius:10}}>
                        <Text style={{fontSize:17,fontWeight:'bold',color:'#333',marginLeft:7,marginTop:10}}>备注清单</Text>
                        <View style={{flexDirection:'row',marginTop:10,alignItems:'center',marginBottom:5}}>
                            <View style={{backgroundColor:'#ebebeb',height:.8,flex:1}}/>
                            <Text style={{fontSize:14,color:'#999'}}>{this.state.remarksData[0].CreateDate?
                                this.state.remarksData[0].CreateDate.substring(0,10):''}</Text>
                            <View style={{backgroundColor:'#ebebeb',height:.8,flex:1}}/>
                        </View>
                        <ListView
                            enableEmptySections = {true}
                            dataSource={this.state.remarksSource}
                            renderRow={(rowData,sectionID,rowID)=>this.remarksItemView(rowData,rowID)}
                        />
                    </View>
                    :null}
                    <View style={{marginTop:22,height:1}}/>
                </ScrollView>
                <View style={{backgroundColor:'#fff',paddingBottom:isIphoneX()?24:0}}>
                <View style={{backgroundColor:'#ebebeb',height:.8,width:width}}/>
                <View style={{width:width,height:48,alignItems:"center",justifyContent:'center',
                    flexDirection:'row',backgroundColor:'#fff',}}>
                    <TouchableOpacity style={{backgroundColor:'#ccc',height:35,alignItems:'center',
                        justifyContent:'center',borderRadius:20,flex:1,marginLeft:10,marginRight:10}}
                        onPress={()=>{this.toSubmitOrder()}}>
                        <Text style={{color:'#333',fontSize:14}}>提交出票</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{backgroundColor:'#ccc',height:35,alignItems:'center',
                        justifyContent:'center',borderRadius:20,flex:1,marginLeft:10,marginRight:10}}
                        onPress={()=>{this.getPayLink();}}>
                        <Text style={{color:'#333',fontSize:14}}>支付链接</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{backgroundColor:'#ccc',height:35,alignItems:'center',
                        justifyContent:'center',borderRadius:20,flex:1,marginLeft:10,marginRight:10}}
                        onPress={()=>{this.toPayOrder()}}>
                        <Text style={{color:'#333',fontSize:14}}>信用扣款</Text>
                    </TouchableOpacity>
                </View>
                <View style={{width:width,height:48,alignItems:"center",justifyContent:'center',
                    flexDirection:'row',backgroundColor:'#fff'}}>
                    <TouchableOpacity style={{backgroundColor:'#ccc',height:35,alignItems:'center',
                        justifyContent:'center',borderRadius:20,flex:1,marginLeft:10,marginRight:10}}
                        onPress={()=>{this.selectSalesClerk();}}>
                        <Text style={{color:'#333',fontSize:14}}>转单给同事</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{backgroundColor:'#ccc',height:35,alignItems:'center',
                        justifyContent:'center',borderRadius:20,flex:1,marginLeft:10,marginRight:10}}
                        onPress={()=>{this.createTripOrder()}}>
                        <Text style={{color:'#333',fontSize:14}}>生成行程单</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </View>
        );
    }

    getOrderDetailInfo = () => {
        let param = {
            "TradeID": this.props.OrderId,
            "OrderID": null,
            // "BookerID": this.props.BookerID,
            "UserCode":this.props.AccountNo,
        }
        Toast.loading(lan.loading, 60, () => {
            Toast.info(lan.loadingFail, 3, null, false);
        });
        RestAPI.invoke("ABIS.SimTradeGet", JSON.stringify(param), (value) => {
            console.log(JSON.stringify(value))
            if(value.Code == 0){
                let ds = new ListView.DataSource({
                    rowHasChanged: (row1, row2) => row1 !== row2,
                });
                this.state.dataSource = ds.cloneWithRows(value.Result.Trade.Orders);
                this.state.orderInfo = value.Result.Trade;
                this.state.passengersName = value.Result.Trade.BookerName;
                this.getIMNr();
                this.getRemarksInfo(this.state.orderInfo.InnerID.ID)
            }else Toast.info(value.Msg, 3, null, false);
        },(err)=>{
            Toast.info(err.message, 3, null, false);
        });
    }

    //获取客户IMNr
    getIMNr = () =>{
        ServingClient.invoke("IMSystem.UserIMNrByUserCodes",{UserCodes:[this.state.orderInfo.BookerID]},
        (value)=>{
            this.state.BookerIMNr= value.UserIMList[0].IMNr
        },(err)=>{
            Toast.info(err.message,3,null,false);
        });
    }

    //获取订单备注信息
    getRemarksInfo = (soid) =>{
        let param = {
            "SOID": soid,
            "PSOID": "",
            "MessageTypeID":1
        }
        RestAPI.invoke("ABIS.SalesOrderMessageByPSOID",JSON.stringify(param),(value)=>{
            if(value.Code==0){
                this.state.remarksData = value.Result.SalesOrderMessages;
                let ds = new ListView.DataSource({
                    rowHasChanged: (row1, row2) => row1 !== row2,
                });
                this.state.remarksSource = ds.cloneWithRows(this.state.remarksData);
                this.setState({});
                Toast.hide();
            }else Toast.info(value.Msg, 3, null, false);
        },(err)=>{
            Toast.info(err.message, 3, null, false);
        })
    }

    //8-国内机票，9-国际机票，2-酒店，5-签证，4-保险
    productInfo = (value,i) => {
        if(value.OrderType == 8 || value.OrderType == 9) {
            return this.planeTicketView(value);
        }else if(value.OrderType == 2){
            return this.hotelView(value);
        }else if(value.OrderType == 4){ 
            return this.insuranceView(value);
        }else if(value.OrderType == 5){ 
            return this.visaView(value);
        }else if(value.OrderType == 796){ 
            return this.phoneCadeView(value);
        }else{
            return this.trainTicketView(value);
        }
    }

    planeTicketView = (info) => {
        let departureDate_time = info.DepartureDate?info.DepartureDate.substring(0,16).replace("T"," "):"";
        return(
            <View>
                <View style={styles.titleViewStyle}>
                    <Text style={{fontSize:16,color:"#333",flex:1,fontWeight:'bold'}}>
                        {info.OrderTypeName}
                    </Text>
                    <Text style={{fontSize:15,color:"#666",}}>{"产品单号:"+info.OrderID}</Text>
                </View>
                <View style={styles.itemViewStyle}>
                    <View style={{flex:4}}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                                alignItems:'center',justifyContent:'center'}}>
                                <Icon icon={'0xe660'} color={'#fff'} style={{fontSize: 16}} />
                            </View>
                                <Text style={{color:'#333',fontSize:16,marginLeft:8}}>{info.Intro.replace(/\-/g,"→")}</Text>
                        </View>
                        <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{lan.departureDate+":"+departureDate_time}</Text>
                        <Text style={{color:'#666',marginLeft:32,marginTop:2}}>{"下单时间:"+(info.CreateTime?info.CreateTime.substring(0,16).replace("T"," "):"")}</Text>
                        <Text style={{color:'#666',marginLeft:32,marginTop:5}} numberOfLines={1}>{"下单人："+this.state.passengersName}</Text>
                    </View>
                    <Text style={{fontSize:16,color:'#F79D10',flex:1.23,textAlign:'right'}}>{info.StatusName}</Text>
                </View>
            </View>
        );
    }

    hotelView = (info) => {
        return(
            <View>
                <View style={styles.titleViewStyle}>
                    <Text style={{fontSize:16,color:"#333",flex:1,fontWeight:'bold'}}>
                        {info.OrderTypeName}
                    </Text>
                    <Text style={{fontSize:15,color:"#666",}}>{"产品单号:"+info.OrderID}</Text>
                </View>
            <View style={styles.itemViewStyle}>
                <View style={{flex:4}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe661'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8,width:width-158}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.Hotal.CheckInDate?
                        ("入住时间:"+info.Hotal.CheckInDate.replace("T"," ")):""}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10',flex:1.23,textAlign:'right'}}>{info.StatusName}</Text>
            </View>
            </View>
        );
    }

    trainTicketView = (info) => {
        return(
            <View>
                <View style={styles.titleViewStyle}>
                    <Text style={{fontSize:16,color:"#333",flex:1,fontWeight:'bold'}}>
                        {info.OrderTypeName}
                    </Text>
                    <Text style={{fontSize:15,color:"#666",}}>{"产品单号:"+info.OrderID}</Text>
                </View>
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe662'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.EurailP2P.Segments[0].Trains[0].DepartureTime
                        ?info.EurailP2P.Segments[0].Trains[0].DepartureTime.replace("T"," "):""}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10'}}>{info.StatusName}</Text>
            </View>
            </View>
        );
    }

    insuranceView = (info) =>{
        return(
            <View>
                <View style={styles.titleViewStyle}>
                    <Text style={{fontSize:16,color:"#333",flex:1,fontWeight:'bold'}}>
                        {info.OrderTypeName}
                    </Text>
                    <Text style={{fontSize:15,color:"#666",}}>{"产品单号:"+info.OrderID}</Text>
                </View>
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe697'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8,width:width-158}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.Insure.EffectiveStart}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10',width:80,textAlign:'right'}}>{info.StatusName}</Text>
            </View>
            </View>
        );
    }

    phoneCadeView = (info) =>{
        return(
            <View>
                <View style={styles.titleViewStyle}>
                    <Text style={{fontSize:16,color:"#333",flex:1,fontWeight:'bold'}}>
                        {info.OrderTypeName}
                    </Text>
                    <Text style={{fontSize:15,color:"#666",}}>{"产品单号:"+info.OrderID}</Text>
                </View>
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon2 icon={'0xe6c6'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8,width:width-158}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{"启用时间:"+
                        (info.DepartureDate?info.DepartureDate.substring(0,10):'')}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10',width:80,textAlign:'right'}}>{info.StatusName}</Text>
            </View>
            </View>
        );
    }

    visaView = (info) => {
        return(
            <View>
                <View style={styles.titleViewStyle}>
                    <Text style={{fontSize:16,color:"#333",flex:1,fontWeight:'bold'}}>
                        {info.OrderTypeName}
                    </Text>
                    <Text style={{fontSize:15,color:"#666",}}>{"产品单号:"+info.OrderID}</Text>
                </View>
            <View style={styles.itemViewStyle}>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View style={{backgroundColor:'#159E7D',width:24,height:24,borderRadius:12,
                            alignItems:'center',justifyContent:'center'}}>
                            <Icon icon={'0xe696'} color={'#fff'} style={{fontSize: 16}} />
                        </View>
                        <Text style={{color:'#333',fontSize:16,marginLeft:8,width:width-158}}>{info.Intro}</Text>
                    </View>
                    <Text style={{color:'#666',marginLeft:32,marginTop:5}}>{info.Visa.ValidDay}</Text>
                </View>
                <Text style={{fontSize:16,color:'#F79D10'}}>{info.StatusName}</Text>
            </View>
            </View>
        );
    }

    remarksItemView = (info) =>{
        return(
            <View style={{borderRadius:10,padding:10,borderWidth:.8,borderColor:'#ebebeb',margin:5,marginTop:10}}>
                <Text style={{fontSize:16,color:'#333'}}>{(info.OperationName?(info.OperationName+"  "):'')+
                    (info.CreateDate?info.CreateDate.substring(11,19):'')}</Text>
                <Text style={{fontSize:14,color:'#666',marginTop:5}}>{info.Content}</Text>
            </View>
        );
    }

    //查看支付记录
    toPayRecord = () => {
        let pSOShortNrs = '';
        for(var v of this.state.orderInfo.Orders)
            pSOShortNrs = pSOShortNrs+v.OrderID+",";
        this.props.navigator.push({
            name: 'PayRecord',
            component: PayRecord,
            passProps: {
                OrderID: this.props.OrderId,
                PSOShortNrs:pSOShortNrs,
                AccountNo: this.props.AccountNo,
                PayMoney: this.state.orderInfo.TotalAmount
            }
        })
    }

    //查看订单明细
    toOrderDetail = () =>{
        //http://mlr.yiqifei.com/Order/SODetail?nr=S07VCR
        this.props.navigator.push({
            name: 'OrderDetail',
            component: OrderDetail,
            passProps: {
                OrderInfo:this.state.orderInfo
            },

        })
    }

    //信用扣款
    toPayOrder = () => {
        if(this.state.orderInfo.StatusID == 28 || this.state.orderInfo.StatusID == 14){
            Toast.info('订单已处理，无需代扣处理!',3,null,false);
            return;
        }
        this.props.navigator.push({
            name: 'CreditPayment',
            component: CreditPayment,
            passProps: {
                OrderID: this.props.OrderId,
                OrderInfo:this.state.orderInfo,
                AccountNo: this.props.AccountNo,
                PayMoney: this.state.orderInfo.TotalAmount,
                Refresh:()=>{this.getOrderDetailInfo();}
            },
        })
    }

    //获取单个产品价格
    getProductPrice = () => {
        let con = '(';
        for (var value of this.state.orderInfo.Orders) {  
            if(value.OrderType == 8 || value.OrderType == 9) con = con+lan.flights+":¥"+value.TotalAmount+" ";
            else if(value.OrderType == 2) con = con+lan.hotel+":¥"+value.TotalAmount+" ";
            else if(value.OrderType == 4) con = con+lan.insurance+":¥"+value.TotalAmount+" ";
            else if(value.OrderType == 5) con = con+lan.visa+":¥"+value.TotalAmount+" ";
            else con = con+lan.trains+":¥"+value.TotalAmount+" ";
        }
        con = con.substring(0,con.length-1)+")";
        return con;  
    }
    
    //获取支付链接
    getPayLink = () =>{
        //http://mlr.yiqifei.com/Order/SODetail?nr=S0F75J  
        this.props.navigator.push({
            name: 'PayLink',
            component: PayLink,
            passProps: {
                OrderID: this.props.OrderId,
                AccountNo: this.props.AccountNo,
                PasName:this.state.orderInfo.BookerName,
                PhoneNr:this.state.orderInfo.ContactMobile,
                PayMoney: this.state.orderInfo.TotalAmount
            }
        })
    }

    //拨打联系人电话
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

    //与客户聊天
    toChatWithBooker = () =>{
        Chat.createConversation(this.props.navigator,this.state.BookerIMNr,this.state.passengersName,'C2C');
    }

    //提交出票
    toSubmitOrder = () =>{
        this.props.navigator.push({
            name: 'SubmitOrder',
            component: SubmitOrder,
            passProps: {
                OrderInfo:this.state.orderInfo,
            },

        })
    }

    //转单给其他同事
    selectSalesClerk = () =>{
        this.props.navigator.push({
            component:ContactOrganization,
            passProps:{
                type:1,
                title:'组织架构',
                PageFrom:true,
                getSalesClerkInfo:(info)=>{//this.state.salesClerkInfo.UserCode
                    // this.state.salesClerkInfo= info.Users[0];
                    // this.state.salesClerkName = this.state.salesClerkInfo.Name;
                }
            }
        })
    }

    //生成行程单
    createTripOrder = () =>{
        // Chat.loginUserResult.SignInInfos[0].UserNr
        this.props.navigator.push({
            name: 'MyWebView',
            component: MyWebView,
            passProps: {
                webUrl:"http://mlr.yiqifei.com/Itinerary?pnr="+this.props.OrderId+"&mid="+
                    Chat.loginUserResult.SignInInfos[0].UserNr+"&VersionNr=0&Language=CN",
                Title:'行程单',
                AccountNo:this.props.AccountNo
            }
        })
    }
}

const styles = StyleSheet.create({
    titleViewStyle:{
        flexDirection:'row',
        backgroundColor:"#fff",
        alignItems: 'center',
        justifyContent: 'center',
        padding:10
    },
    itemViewStyle:{
        backgroundColor:'#fff',
        flexDirection:'row',
        paddingLeft:10,
        paddingRight:10,
        paddingTop:3,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom:10,
        width:width-20
    },
})