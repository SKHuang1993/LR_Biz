import React, {Component} from 'react';
import {
	StyleSheet,View,Text,Dimensions,ScrollView,TouchableOpacity,Image,
} from 'react-native';
import YQFNavBar from '../../components/yqfNavBar';
import {Toast} from 'antd-mobile';
import{ ServingClient } from '../../utils/yqfws';
import { isIphoneX } from 'react-native-iphone-x-helper';
import MyOrderDetail from './myOrderDetail'
import 'moment/locale/zh-cn';
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var {width,height} = Dimensions.get('window')

export default class SuccessPayment extends Component {
    constructor(props) {
        super(props);
        this.state={
            transactionInfo:{},
        };
    }

    componentDidMount(){
        this.getPayDetailInfo();
    }

    render(){
        return(
            <View style={{width:width,height:height,backgroundColor:'#ebebeb',paddingBottom:isIphoneX()?24:0}}>
                <YQFNavBar navigator={this.props.navigator} title={'员工信用扣款'} leftIcon={'0xe183'} />
            <ScrollView style={{flex:1}}>
                <View style={{backgroundColor:'#fff',width:width-20,margin:10,borderRadius:10,alignItems:'center'}}>
                    <Text style={{fontSize:20,color:'#333',marginTop:10}}>{this.props.PayMoney}</Text>
                    <Text style={{fontSize:16,color:'#999',marginTop:3}}>{"应收金额:(元)"}</Text>
                    <View style={{marginTop:20,flexDirection:'row',marginBottom:15}}>
                        <View style={{flex:1,alignItems:'center'}}>
                            <Text style={{fontSize:15,color:'#333'}}>0.00</Text>
                            <Text style={{fontSize:14,color:'#999',marginTop:3}}>{"预收金额:(元)"}</Text>
                        </View>
                        <View style={{flex:1,alignItems:'center'}}>
                            <Text style={{fontSize:15,color:'#333'}}>{this.props.PayMoney}</Text>
                            <Text style={{fontSize:14,color:'#999',marginTop:3}}>{"实收金额(元)"}</Text>
                        </View>
                    </View>
                </View>
                <View style={{borderRadius:10,backgroundColor:'#fff',padding:10,margin:10}}>
                    <Text style={{fontSize:18,color:'#333',fontWeight:'bold'}}>{"扣款详情"}</Text>
                    <View style={{flexDirection:'row',marginTop:15}}>
                        <Text style={{fontSize:16,color:'#999',flex:1}}>{"交易号"}</Text>
                        <Text style={{fontSize:16,color:'#333'}}>{this.state.transactionInfo.SourceTranNr}</Text>
                    </View>
                    <View style={{flexDirection:'row',marginTop:13}}>
                        <Text style={{fontSize:16,color:'#999',flex:1}}>{"交易金额"}</Text>
                        <Text style={{fontSize:16,color:'#333'}}>{this.props.PayMoney+"元"}</Text>
                    </View>
                    <View style={{flexDirection:'row',marginTop:13}}>
                        <Text style={{fontSize:16,color:'#999',flex:1}}>{"交易时间"}</Text>
                        <Text style={{fontSize:16,color:'#333'}}>{this.state.transactionInfo.PayDate?
                            this.state.transactionInfo.PayDate.replace("T"," "):''}</Text>
                    </View>
                    <View style={{flexDirection:'row',marginTop:13}}>
                        <Text style={{fontSize:16,color:'#999',flex:1}}>{"备注"}</Text>
                        <Text style={{fontSize:16,color:'#333'}}>{this.state.transactionInfo.StaffName+"  "+this.state.transactionInfo.StatusName}</Text>
                    </View>
                </View>
                <Image style={{position:'absolute',top:120,right:30,width:125,height:107,}}
                    source={require('../../image/success_pay.png')}/>
            </ScrollView>
                <TouchableOpacity style={{width:width,height:45,alignItems:'center',justifyContent:'center',
                    backgroundColor:'#F79D10'}} onPress={()=>{this.toOrderDetail()}}>
                    <Text style={{fontSize:16,color:'#fff'}}>查看订单</Text>
                </TouchableOpacity>
            </View>
        )
    }

    //获取代扣详情
    getPayDetailInfo = () =>{
        Toast.loading(lan.loading, 60, () => {
            Toast.info(lan.loadingFail, 3, null, false);
        });
        let param = {
            StartDate:this.props.StartDate,
            EndDate:this.props.EndDate,
            SOShortNr:this.props.OrderID
        }
        ServingClient.invoke("LvRui.SOBehalfPaymentByCondition",param,(value)=>{
            Toast.hide();
            console.log(value)
            this.state.transactionInfo = value.Payments[0];
            this.setState({});
        },(err)=>{
            Toast.info(err.message,3,null,false);
        });
    }

    //查看订单
    toOrderDetail = () => {
        this.props.Refresh();
        this.props.navigator.pop();
    }
}

const styles = StyleSheet.create({
})