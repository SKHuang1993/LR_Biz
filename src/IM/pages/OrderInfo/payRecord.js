import React, {Component} from 'react';
import {View,Text,Dimensions,ScrollView} from 'react-native';
import YQFNavBar from '../../components/yqfNavBar';
import {Toast} from 'antd-mobile';
import moment from 'moment';
import{ RestAPI,ServingClient } from '../../utils/yqfws';
import { COLORS } from '../../styles/commonStyle';
import 'moment/locale/zh-cn';
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var {width,height} = Dimensions.get('window');

export default class PayRecord extends Component {
    constructor(props) {
        super(props);
        this.state={
            money:0.0,
            payInfo:[],
        };
    }

    componentDidMount(){
        this.getCreditPayInfo();
    }

    render(){
        return(
            <View style={{width:width,height:height,backgroundColor:'#ebebeb'}}>
                <YQFNavBar navigator={this.props.navigator} title={'支付记录'} leftIcon={'0xe183'} />
                <View style={{padding:20,justifyContent:'center',backgroundColor:'#fff',flexDirection:'row'}}>
                    <View style={{alignItems:'flex-end'}}>
                        <Text style={{color:'#333',fontSize:18}}>订单应付总额:</Text>
                        <Text style={{color:'#333',fontSize:18,marginTop:5}}>订单已付金额:</Text>
                    </View>
                    <View style={{marginLeft:10}}>
                        <Text style={{color:COLORS.btnBg,fontSize:18,fontWeight:'bold'}}>¥{this.props.PayMoney}</Text>
                        <Text style={{color:'#F79D10',fontSize:18,fontWeight:'bold',marginTop:5}}>¥{this.state.money}</Text>
                    </View>
                </View>
                <Text style={{marginLeft:15,color:'#666',fontSize:18,marginTop:25}}>支付明细</Text>
                <View style={{flex:1,marginTop:3,backgroundColor:'#fff',padding:15,alignItems:'center'}}>
                    {this.state.payInfo.length>0?
                    <ScrollView  style={{height:height,width:width-30}}>
                    {this.state.payInfo.map((val,i)=>{
                        return(
                            <View key={i} style={{flexDirection:'row',flex:1,margin:10,width:width-50}}>
                                <Text style={{fontSize:16,color:'#333'}}>{val.time}</Text>
                                <Text style={{fontSize:16,color:COLORS.btnBg,marginLeft:15,flex:1}}>¥{val.money}</Text>
                                <Text style={{fontSize:16,color:'#666',flex:2}}>{val.type}</Text>
                            </View>
                            
                        );
                    })}</ScrollView>
                    :<Text style={{color:'#333',fontSize:16,marginTop:10}}>暂无支付记录</Text>}
                </View>
            </View>
        )
    }

    //获取营业员信用代扣情况
    getCreditPayInfo = () =>{
        Toast.loading(lan.loading, 60, () => {
            Toast.info(lan.loadingFail, 3, null, false);
        });
        let param = {
            StartDate:'2017-01-01T00:00:00',
            EndDate:moment().format(),
            SOShortNr:this.props.OrderID
        }
        ServingClient.invoke("LvRui.SOBehalfPaymentByCondition",param,(value)=>{
            for(var i of value.Payments){
                this.state.money = this.state.money+i.BlanceAmount;
                let info = {
                    time:i.PayDate.substring(0,16).replace('T',' '),
                    money:i.BlanceAmount,
                    type:i.StatusName
                }
                this.state.payInfo.splice(this.state.payInfo.length,0,info);
            }
            this.getUserPayInfo();
        },(err)=>{
            Toast.info(err.message,3,null,false);
        });
    }

    //获取个人支付记录信息
    getUserPayInfo = () =>{
        let param = {
            SOShortNr:this.props.OrderID,
            PSOShortNrs:this.props.PSOShortNrs
        }
        RestAPI.invoke('Payment.PayRecordByOrderNrOfApp',JSON.stringify(param),(value)=>{
            Toast.hide();
            if(value.Code == 0){
                for(var v of value.Result.PayRecords){
                    if(v.PayStatus == 3){
                        this.state.money = this.state.money+v.Amount;
                        let info = {
                            time:v.CreateDate.substring(0,16).replace("T",' '),
                            money:v.Amount,
                            type:v.PayStatusName
                        }
                        this.state.payInfo.splice(this.state.payInfo.length,0,info);
                    }
                }
                this.setState({});
            }else Toast.info(value.Msg,3,null,false);
        },(err)=>{Toast.info(err.message,3,null,false);})
    }
}