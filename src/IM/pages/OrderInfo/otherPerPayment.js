import React, {Component} from 'react';
import {
	StyleSheet,
	View,
    Text,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    Platform,
    TextInput,
} from 'react-native';
import {Toast} from 'antd-mobile';
import DeviceInfo from 'react-native-device-info';
import YQFNavBar from '../../components/yqfNavBar';
import{ RestAPI,ServingClient } from '../../utils/yqfws';
import moment from 'moment';
import SuccessPayment from './successPayment';
import { isIphoneX } from 'react-native-iphone-x-helper';
import ContactOrganization from '../Contact/ContactOrganization';
import 'moment/locale/zh-cn';
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var {width,height} = Dimensions.get('window')

export default class CreditPayment extends Component {
    constructor(props) {
        super(props);
        this.state={
            ip:'',
            isConfirmPayment:false,
            salesClerkName:'',//营业员名字
            money:this.props.PayMoney-this.props.OrderInfo.ReceivedAmount,//代扣金额
            phoneNumber:'',//手机号码
            verCode:'',//输入的验证码
            sendVerCode:'',//接口给的验证码
            time:60,
            salesClerkInfo : {},
            creditInfo:{}
        };
    }

    componentDidMount(){
        fetch("http://pv.sohu.com/cityjson?ie=utf-8").then((res) => {
            res.text().then((text) => {
                let reg = new RegExp('(\\d+)\.(\\d+)\.(\\d+)\.(\\d+)');
                let arr = reg.exec(text);
                this.state.ip = arr[0];
            })
        });
    }

    render(){
        return(
            <View style={{width:width,height:height,backgroundColor:'#ebebeb',paddingBottom:isIphoneX()?24:0}}>
                <YQFNavBar navigator={this.props.navigator} title={'员工信用扣款'} leftIcon={'0xe183'} />
            <ScrollView style={{flex:1,}}>
                <View style={{backgroundColor:'#fff',width:width-20,margin:10,borderRadius:10,alignItems:'center'}}>
                    <Text style={{fontSize:20,color:'#333',marginTop:10}}>{this.props.PayMoney}</Text>
                    <Text style={{fontSize:16,color:'#999',marginTop:3}}>{"应收金额:(元)"}</Text>
                    <View style={{marginTop:20,flexDirection:'row',marginBottom:15}}>
                        <View style={{flex:1,alignItems:'center'}}>
                            <Text style={{fontSize:15,color:'#333'}}>{this.props.OrderInfo.ReceivedAmount}</Text>
                            <Text style={{fontSize:14,color:'#999',marginTop:3}}>{"预收金额:(元)"}</Text>
                        </View>
                        <View style={{flex:1,alignItems:'center'}}>
                            <Text style={{fontSize:15,color:'#333'}}>{this.props.PayMoney-this.props.OrderInfo.ReceivedAmount}</Text>
                            <Text style={{fontSize:14,color:'#999',marginTop:3}}>{"实收金额(元)"}</Text>
                        </View>
                    </View>
                </View>
                <View style={{borderRadius:10,backgroundColor:'#fff',margin:10,padding:10,paddingBottom:15}}>
                    <Text style={{fontSize:16,color:'#333',marginLeft:15,marginRight:15,textAlign:'center',
                        fontWeight:'bold'}}>使用其他营业员账号支付，需发送手机验证码确认
                    </Text>
                    <View style={{flexDirection:'row',alignItems:'center',marginTop:15}}>
                        <Text style={{color:'#333',fontSize:15,flex:1.5,paddingBottom:15}}>营业员</Text>
                        <View style={{alignItems:'center',flexDirection:'row',flex:4,borderBottomColor:'#ddd',
                            borderBottomWidth:.8,paddingBottom:15}}>
                            <Text style={{fontSize:15,color:this.state.salesClerkName==''?'#999':'#333',flex:1}}>
                            {this.state.salesClerkName==''?'请选择营业员':this.state.salesClerkName}</Text>
                            <TouchableOpacity style={{width:100,height:30,alignItems:'center',
                                justifyContent:'center',backgroundColor:'#159E7D',borderRadius:20}}
                                onPress={()=>{this.selectSalesClerk();}}>
                                <Text style={{color:'#fff',fontSize:14}}>选择营业员</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <Text style={{color:'#333',fontSize:15,flex:1.5}}>付款金额</Text>
                        <View style={{alignItems:'center',flexDirection:'row',flex:4,borderBottomColor:'#ddd',
                            borderBottomWidth:.8}}>
                            <TextInput style={{flex:1,height:45,paddingTop:8}}
                                multiline={true} keyboardType={'numeric'}
                                onChangeText={(txt)=>{this.state.money = txt;this.setState({});}}
                                placeholder={'请输入付款金额'} placeholderTextColor='#ccc'
                                underlineColorAndroid="transparent" 
                                selectionColor='#333'/>
                        </View>
                    </View>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <Text style={{color:'#333',fontSize:15,flex:1.5,paddingBottom:0}}>手机号码</Text>
                        <View style={{alignItems:'center',flexDirection:'row',flex:4,borderBottomColor:'#ddd',
                            borderBottomWidth:.8,paddingBottom:0,height:50}}>
                            <Text style={{fontSize:15,color:'#333'}}>{this.state.salesClerkInfo.Phone}</Text>
                        </View>
                    </View>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <Text style={{color:'#333',fontSize:15,flex:1.5}}>验证码</Text>
                        <View style={{alignItems:'center',flexDirection:'row',flex:4,borderBottomColor:'#ddd',
                            borderBottomWidth:.8}}>
                            <TextInput style={{flex:1,height:45,paddingTop:8}}
                                multiline={true} keyboardType={'numeric'}
                                onChangeText={(txt)=>{this.state.verCode = txt;}}
                                placeholder={'请输入验证码'} placeholderTextColor='#ccc'
                                underlineColorAndroid="transparent" 
                                selectionColor='#333'/>
                            <TouchableOpacity style={{width:100,height:30,alignItems:'center',
                                justifyContent:'center',backgroundColor:'#159E7D',borderRadius:20}}
                                onPress={()=>{
                                    if(this.state.time==60){
                                        this.getVerCode();
                                    }
                                }}>
                                <Text style={{color:'#fff',fontSize:14}}>
                                    {this.state.time==60?'发送验证码':(this.state.time+" s")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
                <TouchableOpacity style={{width:width,height:45,alignItems:'center',justifyContent:'center',
                    backgroundColor:'#F79D10'}} onPress={()=>{this.toPay();}}>
                    <Text style={{fontSize:16,color:'#fff'}}>确定扣款{this.state.money}元</Text>
                </TouchableOpacity>
            </View>
        )
    }

    //选择营业员
    selectSalesClerk = () =>{
        this.props.navigator.push({
            component:ContactOrganization,
            passProps:{
                type:1,
                title:'组织架构',
                PageFrom:true,
                getSalesClerkInfo:(info)=>{//this.state.salesClerkInfo.UserCode
                    this.state.salesClerkInfo= info.Users[0];
                    this.state.salesClerkName = this.state.salesClerkInfo.Name;
                    if(this.state.salesClerkInfo.Phone==null||this.state.salesClerkInfo.Phone=='')
                        this.getSalesInfo();
                    this.getCreditInfo();
                }
            }
        })
    }

    //获取营业员信息
    getSalesInfo = () =>{
        let param = {
            UserCode:this.state.salesClerkInfo.UserCode,
            StaffName:this.state.salesClerkName
        }
        RestAPI.invoke("CRM.StaffByCondition",JSON.stringify(param),(value)=>{
            if(value.Code==0){
                this.state.salesClerkInfo.Phone = value.Result.StaffContacts[0].StaffWorkPhone;
                this.setState({});
            }else Toast.info(value.Msg,3,null,false);
        },(err)=>{
            Toast.info(err.message,3,null,false);
        })
    }

    //获取自身信用账户信息
    getCreditInfo = () =>{
        Toast.loading(lan.loading, 60, () => {
            Toast.info(lan.loadingFail, 3, null, false);
        });
        let param = {
            "OwnerTypeID": 3,
            "OwnerCode": this.state.salesClerkInfo.UserCode
        }
        RestAPI.invoke("Payment.UserAccountByOwnerCode", JSON.stringify(param), (value) => {
            for(var v of value.Result.UserAccounts){
                if(v.AccountTypeID == 2){
                    this.state.creditInfo = v;
                    break;
                }
            }
            this.setState({});
            Toast.hide();
        },(err)=>{
            Toast.info(err.message,3,null,false);
        });
    }

    //发送验证码
    getVerCode = () =>{
        if(this.isMPNumber(this.state.salesClerkInfo.Phone)){
            this.state.time--;
            this.setState({});
            this.setTimeOut();
            let param = {
                "LoginModeID": 3,
                "LoginName": this.state.salesClerkInfo.Phone,
                "WebsiteName": "抢单APP",
                "Minute": 30,
                "IP": this.state.ip,
                "NetID": DeviceInfo.getUniqueID(),
            }
            RestAPI.invoke("CRM.SecurityCodeGet",JSON.stringify(param),(value)=>{  
                if (value.Code == 0) {
                    this.state.sendVerCode = value.Result.SecurityCode;
                } else {
                    Toast.info(value.Msg, 3, null, false);
                }
            },(err)=>{
                Toast.info(err, 3, null, false);
            });
        }else{
            Toast.info('手机号码输入有误！',3,null,false);
        }
        
    }

    //信用代扣操作
    toPay = () =>{
        if(this.state.sendVerCode != this.state.verCode){
            Toast.info('验证码输入有误！',3,null,false);
            return;
        }
        if(this.state.money>this.state.creditInfo.AvailableBalance){
            Toast.info('付款金额大于该营业员信用代扣下可用金额('+this.state.creditInfo.AvailableBalance+
            ' 元)，请确认修改',3,null,false);
            return;
        }
        Toast.loading(lan.loading, 60, () => {
            Toast.info(lan.loadingFail, 3, null, false);
        });
        let startDate = moment().format();
        let param = {
            OrderID:this.props.OrderInfo.InnerID.ID,
            OrderNr:this.props.OrderInfo.InnerID.ShortNr,
            OperationUserCode:this.props.AccountNo,
            OperationStaffCode:this.props.StaffCode,
            SOBehalfPayments:[
                {
                    Amount:this.state.money,
                    StaffAccountID:this.state.creditInfo.ID,
                    StaffAccountNr:this.state.creditInfo.AccountNr,
                    StaffCode:this.state.salesClerkInfo.PersonCode,
                    UserCode:this.state.salesClerkInfo.UserCode
                }
            ],
            SysType:5
        }
        ServingClient.invoke("AutoServer.Assit.StaffCreditDebitBySO",param,(value)=>{
            Toast.hide();
            if(value.Flag==1){
                this.toConfirmPayment(startDate);
            }else
                Toast.info(value.Msg,3,null,false);
        },(err)=>{
            Toast.info(err.message,3,null,false);
        })
    }

    //代扣成功跳转操作
    toConfirmPayment = (startDate) =>{
        this.props.navigator.replace({
            name: 'SuccessPayment',
            component: SuccessPayment,
            passProps: {
                OrderID: this.props.OrderID,
                AccountNo: this.props.AccountNo,
                PayMoney: this.state.money,
                StartDate:startDate,
                EndDate:moment().format(),
                Refresh:this.props.Refresh
            },
        })
    }

    //判断手机号码输入是否正确
    isMPNumber = (Tel) => {
        var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
        if (myreg.test(Tel)) {
            return true;
        } else {
            return false;
        }
    }

    //验证码倒计时
    setTimeOut = () =>{
        setTimeout(() => { 
            this.state.time--;
            if(this.state.time>0)
                this.setTimeOut();
            else this.state.time = 60;
            this.setState({});
        },1000);  
    }
}

const styles = StyleSheet.create({
})