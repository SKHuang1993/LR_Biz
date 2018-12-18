import React, {Component} from 'react';
import {View,Text,Dimensions,TouchableOpacity,Image,Alert,Clipboard,NativeModules
} from 'react-native';
import YQFNavBar from '../../components/yqfNavBar';
import {Toast,Popup} from 'antd-mobile';
import Icon from '../../../components/icons/icon';
import{ RestAPI } from '../../utils/yqfws';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { COLORS } from '../../styles/commonStyle';
import 'moment/locale/zh-cn';
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var {width,height} = Dimensions.get('window');

export default class PayLink extends Component {
    constructor(props) {
        super(props);
        this.state={
            Route:'',
            QRCode:'http',
            content:'',
            isPopup:false,
        };
    }

    componentDidMount(){
        this.getPayLink();
    }

    render(){
        this.state.content = '一起飞订单[S0F75J]支付,您正在一起飞国际机票网进行一笔金额为'+this.props.PayMoney+
                '元的交易,请点击链接'+this.state.Route+'在60分钟内完成支付,非本人交易请忽略.【一起飞支付】'
        return(
            <View style={{width:width,height:height,backgroundColor:'#ebebeb',paddingBottom:isIphoneX()?24:0}}>
                <YQFNavBar navigator={this.props.navigator} title={'支付链接'} leftIcon={'0xe183'} />
                <Text style={{margin:15,fontSize:16,color:'#333',marginBottom:5}}>
                    复制一下内容分析分享，或者微信/支付宝扫码二维码，点击分享分享页面
                </Text>
                <View style={{margin:10,backgroundColor:'#fff',borderRadius:8,padding:15}}>
                    <Text style={{color:'#333',fontSize:18}} onLongPress={()=>{
                        this.longPressEvent();
                    }}>{this.state.content}</Text>
                </View>
                <View style={{width:width,alignItems:'center',marginTop:10}}>
                    <Text style={{fontSize:14,fontWeight:'bold',color:'#333'}}>微信/支付宝扫描二维码进行支付</Text>
                    <Image style={{width:150,height:150,marginTop:10}} source={{uri:this.state.QRCode}}/>
                </View>
                <TouchableOpacity style={{width:width-30,height:45,alignItems:'center',justifyContent:'center',
                    backgroundColor:COLORS.btnBg,marginTop:15,marginLeft:15,borderRadius:8}} 
                    onPress={()=>{this.toShare()}}>
                    <Text style={{fontSize:16,color:'#fff'}}>{lan.share}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    //获取支付链接
    getPayLink = () =>{
        Toast.loading(lan.loading, 60, () => {
            Toast.info(lan.loadingFail, 3, null, false);
        });
        let param = {
            Url:'https://pay.yiqifei.com/pay/getpay?OrderID='+this.props.OrderID+
                '&PayMoney='+this.props.PayMoney+'&ClientID='+this.props.AccountNo+
                '&PayText='+this.props.PasName+'/'+this.props.PhoneNr+
                '&ReturnUrl=http://mlr.yiqifei.com/',
            CreateQRCode:true
        }
        RestAPI.invoke('Base.CreateRoute',JSON.stringify(param),(value)=>{
            Toast.hide();
            if(value.Code==0){
                this.state.Route = value.Result.Route;
                this.state.QRCode = value.Result.QRCode;
                this.setState({});
            }else Toast.info(value.Msg,3,null,false);
        },(err)=>{
            Toast.info(err.message,3,null,false);
        })
    }

    //长按内容框事件
    longPressEvent = () =>{
        Alert.alert('提示','是否复制框内内容？',
            [
                {text: '复制', onPress: () => {Clipboard.setString(this.state.content);}},
                {text: lan.cancel, onPress: () => {}},
            ]
        )
    }

    toShare = () =>{
        let wrapProps;
        Popup.show(
            <View style={{paddingBottom:isIphoneX()?24:0}}>
                <View style={{flexDirection:'row',width:width,backgroundColor:'#fff',paddingTop:10,alignItems:'center'}}>
                        <TouchableOpacity style={{alignItems:'center',flex:1}} 
                            onPress={()=>{this.shareToPlatform(1)}}>
                            <Icon icon={'0xe6d6'} color={'#6DD144'} style={{fontSize: 45,flex:1}}/>
                            <Text style={{fontSize:13,color:'#333',marginBottom:5}}>{lan.wechat}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{alignItems:'center',flex:1}}
                            onPress={()=>{this.shareToPlatform(2)}}>
                            <Icon icon={'0xe6a6'} color={'#6DD144'} style={{fontSize: 45,}}/>
                            <Text style={{fontSize:13,color:'#333',marginBottom:5}}>朋友圈</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{alignItems:'center',flex:1}}
                            onPress={()=>{this.shareToPlatform(3)}}>
                        <Icon icon={'0xe6d5'} color={'#007ACC'} style={{fontSize: 45,}}/>
                        <Text style={{fontSize:13,color:'#333',marginBottom:5}}>QQ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{alignItems:'center',flex:1}}
                            onPress={()=>{this.shareToPlatform(4)}}>
                            <Icon icon={'0xe636'} color={COLORS.btnBg} style={{fontSize: 48,}}/>
                            <Text style={{fontSize:13,color:'#333',marginBottom:5}}>微博</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{alignItems:'center',flex:1}}
                            onPress={()=>{Clipboard.setString(this.state.Route);}}>
                            <Icon icon={'0xe6de'} color={"#666"} style={{fontSize: 36,}}/>
                            <Text style={{fontSize:13,color:'#333',marginTop:5}}>复制链接</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{width:width,height:1,backgroundColor:'#ebebeb'}}/>
                    <TouchableOpacity style={{height:44,width:width,justifyContent:'center',alignItems:'center'}}
                        onPress={()=>{Popup.hide();}}>
                        <Text style={{color:COLORS.btnBg,fontSize:15}}>{lan.cancel}</Text>
                    </TouchableOpacity>
            </View>
            , { animationType: 'slide-up', wrapProps, maskClosable: false });
    }

    //分享事件
    shareToPlatform = (type) =>{
        let param = {
            Type:type,
            Title:"抢单--支付链接",
            Content:this.state.content,
            ImageUrl:this.state.QRCode,
            Url:this.state.Route
        }
        NativeModules.MyNativeModule.shareToPlatform(param,type).then((back)=>{
            alert(back); 
        });
        Popup.hide();
    }
}