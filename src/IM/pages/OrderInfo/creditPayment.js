import React, {Component} from 'react';
import {StyleSheet,View,Text,Dimensions,ScrollView,TouchableOpacity} from 'react-native';
import {Toast} from 'antd-mobile';
import YQFNavBar from '../../components/yqfNavBar';
import{ RestAPI,ServingClient } from '../../utils/yqfws';
import { isIphoneX } from 'react-native-iphone-x-helper';
import moment from 'moment';
import { Chat } from '../../utils/chat';
import SuccessPayment from './successPayment';
import OtherPay from './otherPerPayment';
import 'moment/locale/zh-cn';
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var {width,height} = Dimensions.get('window')

export default class CreditPayment extends Component {
    constructor(props) {
        super(props);
        this.state={
            isConfirmPayment:false,
            staffCode:Chat.loginUserResult.PersonCode,
            creditInfo:{}
        };
    }

    componentDidMount(){
        this.getCreditInfo();
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
                <View style={{width:width,height:10,backgroundColor:'#ebebeb'}}/>
                <View style={{padding:10,width:width}}>
                    {/* <Text style={{fontSize:16,color:'#333'}}>{"扣款详情"}</Text>
                    <View style={{padding:10,backgroundColor:'#ebebeb',borderColor:"#ccc",borderWidth:.8,marginTop:3}}>
                        <Text style={{fontSize:15,color:'#333'}}>{"交易单:"}</Text>
                        <Text style={{fontSize:15,color:'#333',marginTop:2}}>{"交易金额:"}</Text>
                        <Text style={{fontSize:15,color:'#333',marginTop:2}}>{"交易时间:"}</Text>
                        <Text style={{fontSize:15,color:'#333',marginTop:2}}>{"备注:"}</Text>
                    </View> */}
                    <View style={{borderRadius:10,backgroundColor:'#fff',padding:10}}>
                        <Text style={{fontSize:18,color:'#333',fontWeight:'bold'}}>{"账号信息"}</Text>
                        <View style={{flexDirection:'row',marginTop:15}}>
                            <Text style={{fontSize:16,color:'#999',flex:1}}>{"账号类型"}</Text>
                            <Text style={{fontSize:16,color:'#333'}}>{this.state.creditInfo.AccountTypeCName}</Text>
                        </View>
                        <View style={{flexDirection:'row',marginTop:13}}>
                            <Text style={{fontSize:16,color:'#999',flex:1}}>{"账号号码"}</Text>
                            <Text style={{fontSize:16,color:'#333'}}>{this.state.creditInfo.AccountNr}</Text>
                        </View>
                        <View style={{flexDirection:'row',marginTop:13}}>
                            <Text style={{fontSize:16,color:'#999',flex:1}}>{"信用额度"}</Text>
                            <Text style={{fontSize:16,color:'#333'}}>{this.state.creditInfo.CombinedLimit}</Text>
                        </View>
                        <View style={{flexDirection:'row',marginTop:13}}>
                            <Text style={{fontSize:16,color:'#999',flex:1}}>{"可用额度"}</Text>
                            <Text style={{fontSize:16,color:'#333'}}>{this.state.creditInfo.AvailableBalance}</Text>
                        </View>
                        <View style={{flexDirection:'row',marginTop:13}}>
                            <Text style={{fontSize:16,color:'#999',flex:1}}>{"货币类型"}</Text>
                            <Text style={{fontSize:16,color:'#333'}}>{this.state.creditInfo.CurrencyEName}</Text>
                        </View>
                    </View>
                    {this.state.isConfirmPayment?
                    <Text style={{fontSize:13,color:'#666',marginTop:15,paddingLeft:10,paddingRight:10}}>
                        温馨提示：您的信用额度>50%，可使用简易扣款，点击扣款直接扣除您的信用额度
                    </Text>
                    :<Text style={{fontSize:13,color:'#666',marginTop:15,paddingLeft:10,paddingRight:10}}>
                        产品单结算方式为现付，本次付款使用现金账号，付款金额：{this.props.PayMoney}，客户账号余额：0，余额不足
                    </Text>}
                </View>
            </ScrollView>
                {this.state.isConfirmPayment?
                <View style={{width:width,height:45,flexDirection:'row'}}>
                    <TouchableOpacity style={{alignItems:'center',justifyContent:'center',flex:1.1,
                        backgroundColor:'#159E7D'}} onPress={()=>{this.toOtherPayment()}}>
                        <Text style={{fontSize:15,color:'#fff'}}>使用其他营业员账号</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{alignItems:'center',justifyContent:'center',flex:.9,
                        backgroundColor:'#F79D10'}} onPress={()=>{ this.toConfirmPayment()}}>
                        <Text style={{fontSize:15,color:'#fff'}}>确定扣款{this.props.PayMoney}元</Text>
                    </TouchableOpacity>
                </View>    
                :<TouchableOpacity style={{width:width,height:45,alignItems:'center',justifyContent:'center',
                    backgroundColor:'#F79D10'}} onPress={()=>{this.state.isConfirmPayment = true;this.setState({});}}>
                    <Text style={{fontSize:16,color:'#fff'}}>使用员工信用扣款</Text>
                </TouchableOpacity>}
            </View>
        )
    }

    //获取自身信用账户信息
    getCreditInfo = () =>{
        Toast.loading(lan.loading, 60, () => {
            Toast.info(lan.loadingFail, 3, null, false);
        });
        let param = {
            "OwnerTypeID": 3,
            "OwnerCode": this.props.AccountNo
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
            Toast.info(err, 3, null, false);
        });
    }

    //代扣支付操作
    toConfirmPayment = () =>{
        if((this.props.PayMoney-this.props.OrderInfo.ReceivedAmount)>this.state.creditInfo.AvailableBalance){
            Toast.info('付款金额大于信用代扣下可用金额('+this.state.creditInfo.AvailableBalance+
            ' 元)，无法进行代扣处理，可选择他人代扣!',3,null,false);
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
            OperationStaffCode:this.state.staffCode,
            SOBehalfPayments:[
                {
                    Amount:this.props.PayMoney,
                    StaffAccountID:this.state.creditInfo.ID,
                    StaffAccountNr:this.state.creditInfo.AccountNr,
                    StaffCode:this.state.staffCode,
                    UserCode:this.props.AccountNo
                }
            ],
            SysType:5
        }
        ServingClient.invoke("AutoServer.Assit.StaffCreditDebitBySO",param,(value)=>{
            Toast.hide();
            if(value.Flag==1){
                this.props.navigator.replace({
                    name: 'SuccessPayment',
                    component: SuccessPayment,
                    passProps: {
                        OrderID: this.props.OrderID,
                        AccountNo: this.props.AccountNo,
                        PayMoney: this.props.PayMoney,
                        StartDate:startDate,
                        EndDate:moment().format(),
                        Refresh:this.props.Refresh
                    },
                })
            }else
                Toast.info(value.Msg,3,null,false);
        },(err)=>{
            Toast.info(err.message,3,null,false);
        })
    }

    //选择他人代扣
    toOtherPayment = () =>{
        this.props.navigator.replace({
            name: 'OtherPay',
            component: OtherPay,
            passProps: {
                OrderID: this.props.OrderID,
                OrderInfo:this.props.OrderInfo,
                AccountNo: this.props.AccountNo,
                PayMoney: this.props.PayMoney,
                StaffCode:this.state.staffCode,
                Refresh:this.props.Refresh
            },
        })
    }
}

const styles = StyleSheet.create({
})