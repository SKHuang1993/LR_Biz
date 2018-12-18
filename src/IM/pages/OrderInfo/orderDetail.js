import React, { Component } from 'react';
import {StyleSheet,View,Text,Dimensions,ListView,ScrollView,TouchableOpacity,Image
} from 'react-native';
import { Toast,Popup } from 'antd-mobile';
import Icon from '../../../components/icons/icon';
import YQFNavBar from '../../components/yqfNavBar';
import { COLORS, FLEXBOX } from '../../styles/commonStyle';
import { RestAPI,ServingClient } from '../../utils/yqfws';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var { width, height } = Dimensions.get('window')
const proofType = [
    {
        "TypeCode": "10",
        "Name": lan.militaryCard,
      },
      {
        "TypeCode": "11",
        "Name": lan.reentryPermit,
      },
      {
        "TypeCode": "12",
        "Name": lan.mtp,
      },
      {
        "TypeCode": "13",
        "Name": lan.EEP,
      },
      {
        "TypeCode": "ID",
        "Name": lan.ID,
      },
      {
        "TypeCode": "NI",
        "Name": lan.other,
      },
      {
        "TypeCode": "PP",
        "Name": lan.passport,
      }
];

export default class orderDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            passengersInfo:this.props.OrderInfo.Orders[0].Passengers,
            dataSource:new ListView.DataSource({
                rowHasChanged: (row1, row2) => row1 !== row2,
            }),
        }
    }

    componentDidMount() {
        for(var i=1;i<this.props.OrderInfo.Orders.length;i++){
            for(var j of this.props.OrderInfo.Orders[i].Passengers){
                let isEqually = false;
                for(var k of this.state.passengersInfo){
                    if(j.CertNr==k.CertNr){
                        isEqually = true;
                        break;
                    }
                }
                if(!isEqually) this.state.passengersInfo.splice(this.state.passengersInfo.length,0,j);
            }
        }
    }

    render() {
        let ds = new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
        });
        this.state.dataSource = ds.cloneWithRows(this.props.OrderInfo.Orders);
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.containerBg }}>
                <YQFNavBar navigator={this.props.navigator} title={'订单明细'}
                    leftIcon={'0xe183'} //rightIcon={'0xe667'}
                    onLeftClick={()=>{
                        this.props.navigator.pop();
                    }}
                />
                <ScrollView>
                    <View style={{margin:10,backgroundColor:'#fff',borderRadius:8,padding:10}}>
                        <View style={{flexDirection:'row',marginTop:2}}>
                            <Text style={{fontSize:15,color:'#999',flex:1}}>订单编号</Text>
                            <Text style={{fontSize:15,color:'#333'}}>{this.props.OrderInfo.TradeID}</Text>
                        </View>
                        <View style={{flexDirection:'row',marginTop:8}}>
                            <Text style={{fontSize:15,color:'#999',flex:1}}>总金额</Text>
                            <Text style={{fontSize:15,color:COLORS.btnBg}}>
                                {"¥"+this.props.OrderInfo.TotalAmount}
                            </Text>
                        </View>
                        <View style={{flexDirection:'row',marginTop:8}}>
                            <Text style={{fontSize:15,color:'#999',flex:1}}>下单时间</Text>
                            <Text style={{fontSize:15,color:'#333'}}>{this.props.OrderInfo.CreateTime?
                                this.props.OrderInfo.CreateTime.substring(0,16).replace("T"," "):''}</Text>
                        </View>
                        <View style={{flexDirection:'row',marginTop:8}}>
                            <Text style={{fontSize:15,color:'#999',flex:1}}>订单来源</Text>
                            <Text style={{fontSize:15,color:'#333'}}>{this.props.OrderInfo.SourceName}</Text>
                        </View>
                        <View style={{flexDirection:'row',marginTop:8,marginBottom:5}}>
                            <Text style={{fontSize:15,color:'#999',flex:1}}>订单状态</Text>
                            <Text style={{fontSize:15,color:'#333'}}>{this.props.OrderInfo.StatusName}</Text>
                        </View>
                    </View>
                    <ListView style={{marginLeft:10,marginRight:10}} enableEmptySections = {true}
                            dataSource={this.state.dataSource}
                            renderRow={(rowData,sectionID,rowID)=>this.productInfo(rowData,rowID)}/>
                    <View style={{margin:10,backgroundColor:'#fff',borderRadius:8,padding:10,paddingBottom:0}}>
                        <Text style={{color:'#333',fontSize:17,fontWeight:'bold'}}>旅客信息</Text>
                        <View style={{marginTop:10}}/>
                        {this.state.passengersInfo.map((val,i)=>{
                            return this.passengersItemView(val,i);
                        })}
                    </View>
                </ScrollView>
            </View>
        );
    }

    //8-国内机票，9-国际机票，2-酒店，5-签证，4-保险,796-电话卡
    productInfo = (value,i) => {
        return(
            <View style={{backgroundColor:'#fff',borderTopLeftRadius:i==0?8:0,borderTopRightRadius:i==0?8:0,
                borderBottomLeftRadius:i==this.props.OrderInfo.Orders.length-1?8:0,
                borderBottomRightRadius:i==this.props.OrderInfo.Orders.length-1?8:0}}>
                <View key={i} style={{flexDirection:'row',padding:10,}}>
                    <View style={{width:22,height:22,borderRadius:11,backgroundColor:'#ebebeb',
                        alignItems:'center',justifyContent:'center',marginRight:10}}>
                        <Text style={{fontSize:14,color:'#333'}}>{parseInt(i)+1}</Text>
                    </View>
                    {value.OrderType == 8 || value.OrderType == 9?this.planeTicketView(value,i):
                    value.OrderType == 2?this.hotelView(value,i):
                    value.OrderType == 4?this.insuranceView(value,i):
                    value.OrderType == 5?this.visaView(value,i):
                    value.OrderType == 796?this.phoneCadeView(value,i):this.trainTicketView(value,i)}
                </View>
                {i==this.props.OrderInfo.Orders.length-1?null:
                <View style={{borderBottomColor:'#ccc',borderBottomWidth:.6,marginLeft:10,marginRight:10}}/>}
            </View>
        );
    }

    //机票样式页面
    planeTicketView = (info,index) =>{
        return(//"http://airlineico.b0.upaiyun.com/" + domeTicketInfo.getMarkrtingAirline() + ".png"
            <View style={{flex:1}}>
            {info.Ticket.Segments.map((value,index)=>{
                return(
                    <View key={index} style={{flex:1}}>
                        <View style={{flexDirection:'row',marginTop:index==0?0:15,alignItems:'center'}}>
                            <View style={{backgroundColor:COLORS.btnBg,height:.6,flex:1}}/>
                            <Text style={{color:COLORS.btnBg,fontSize:16}}>第{index+1}程</Text>
                            <View style={{backgroundColor:COLORS.btnBg,height:.6,flex:1}}/>
                        </View>
                        {value.Flights.map((val,i)=>{
                return(<View key={i} style={{flex:1,alignItems:'center'}}>
                    {i==0?null:<View style={{backgroundColor:'#ebebeb',height:.6,marginTop:10,width:width-108,marginBottom:5}}/>}
                    <View style={{flexDirection:'row',flex:1}}>
                        <View style={{alignItems:'flex-end',flex:1}}>
                            <Text style={{fontSize:16,color:"#333"}}>{val.DepartureTime.substring(0,10)}</Text>
                            <Text style={{fontSize:20,color:"#333",marginTop:5}}>
                            {val.DepartureTime?val.DepartureTime.substring(11,16):''}
                            </Text>
                            <Text style={{fontSize:15,color:"#333",marginTop:5}}>
                            {val.DepartureAirport.AirportName+val.DepartureAirport.Terminal}
                            </Text>
                        </View>
                        <View>
                            <View style={{flex:1}}/>
                            <Icon icon={'0xe67b'} color={'#ccc'} style={{fontSize: 24,marginLeft:20,marginRight:20}} />
                            <View style={{flex:1}}/>
                        </View>
                        <View style={{flex:1}}>
                            <Text style={{fontSize:16,color:"#333"}}>
                            {val.ArrivalTime?val.ArrivalTime.substring(0,10):''}</Text>
                            <Text style={{fontSize:20,color:"#333",marginTop:5}}>
                            {val.ArrivalTime?val.ArrivalTime.substring(11,16):''}
                            </Text>
                            <Text style={{fontSize:15,color:"#333",marginTop:5}}>
                            {val.ArrivalAirport.AirportName+val.ArrivalAirport.Terminal}
                            </Text>
                        </View>
                    </View>
                    <View style={{flexDirection:'row',marginTop:10,alignItems:'center'}}>
                        <Image source={{uri:"http://airlineico.b0.upaiyun.com/"+val.MarketingAirline.Code+".png"}}
                            style={{width:22,height:22}}/>
                        <Text style={{marginLeft:10,fontSize:14,color:'#999'}}>
                        {val.MarketingAirline.ShortName+val.FlightNumber}</Text>
                        <View style={{backgroundColor:'#999',marginLeft:8,marginRight:8,width:.6,height:18}}/>
                        <Text style={{fontSize:14,color:'#999'}}>{val.Equipment}</Text>
                        <View style={{backgroundColor:'#999',marginLeft:8,marginRight:8,width:.6,height:18}}/>
                        <Text style={{fontSize:14,color:'#999'}}>{val.CabinLevel}</Text>
                        <View style={{backgroundColor:'#999',marginLeft:8,marginRight:8,width:.6,height:18}}/>
                        <Text style={{fontSize:14,color:'#999'}}>
                        {parseInt(val.ElapsedTime/60)}h{val.ElapsedTime%60}m</Text>
                        <View style={{backgroundColor:'#999',marginLeft:8,marginRight:8,width:.6,height:18}}/>
                    </View>
                </View>)
            })}
                    </View>
                );
            })}
            </View>
        );
    }

    //酒店样式页面
    hotelView = (info,index) =>{
        return(
            <View style={{flex:1}}>
                <Text style={{color:'#333',fontSize:16,marginBottom:8,fontWeight:'bold'}}>酒店</Text>
                <Text style={{color:'#333',fontSize:16}}>{info.Intro}</Text>
                <Text style={{color:'#666',marginTop:8}}>{info.Hotal.CheckInDate?
                        ("入住时间:"+info.Hotal.CheckInDate.replace("T"," ")):""}</Text>
                <Text style={{color:'#666',marginTop:3}}>{info.Hotal.CheckOutDate?
                    ("退房时间:"+info.Hotal.CheckOutDate.replace("T"," ")):''}</Text>
            </View>
        );
    }

    //火车票样式页面
    trainTicketView = (info,index) =>{
        return(
            <View style={{flex:1}}>
                {info.EurailP2P.Segments.map((val,i)=>{
                    return(
                        <View key={i} style={{flex:1}}>
                            {i==0?null:<View style={{backgroundColor:'#ebebeb',height:.6,marginTop:10,width:width-108,marginBottom:5}}/>}
                            <View style={{flexDirection:'row',marginBottom:8}}>
                                <Text style={{fontSize:16,fontWeight:'bold',color:'#333',flex:1}}>{val.Trains[0].TrainNumber}</Text>
                                <Text style={{color:'#666',fontSize:15}}>{val.Trains[0].CabinLevel}</Text>
                            </View>
                            <View style={{flexDirection:'row',flex:1}}>
                                <View style={{alignItems:'flex-end',flex:1}}>
                                    <Text style={{fontSize:16,color:"#333"}}>
                                        {val.Trains[0].DepartureTime.substring(0,10)}</Text>
                                    <Text style={{fontSize:20,color:"#333",marginTop:5}}>
                                        {val.Trains[0].DepartureTime.substring(11,16)}
                                    </Text>
                                    <Text style={{fontSize:15,color:"#333",marginTop:5}}>
                                    {val.Trains[0].DepartureStation.StationName}
                                    </Text>
                                </View>
                                <View>
                                    <View style={{flex:1}}/>
                                    <Icon icon={'0xe69a'} color={'#ccc'} style={{fontSize: 32,marginLeft:20,marginRight:20}} />
                                    <View style={{flex:1}}/>
                                </View>
                                <View style={{flex:1}}>
                                    <Text style={{fontSize:16,color:"#333"}}>
                                    {val.Trains[0].ArrivalTime.substring(0,10)}</Text>
                                    <Text style={{fontSize:20,color:"#333",marginTop:5}}>
                                    {val.Trains[0].ArrivalTime.substring(11,16)}
                                    </Text>
                                    <Text style={{fontSize:15,color:"#333",marginTop:5}}>
                                    {val.Trains[0].ArrivalStation.StationName}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )
                })}
            </View>
        );
    }

    //保险样式页面
    insuranceView = (info,index) =>{
        return(
            <View style={{flex:1}}>
                <Text style={{color:'#333',fontSize:16,marginBottom:8,fontWeight:'bold'}}>保险</Text>
                <Text style={{color:'#333',fontSize:16}}>{info.Intro}</Text>
                <Text style={{color:'#666',marginTop:8}}>{"生效时间:"+info.Insure.EffectiveStart}</Text>
                <Text style={{color:'#666',marginTop:3}}>{"保险天数 :"+info.Insure.DayQty+"天"}</Text>
            </View>
        );
    }

    //签证样式页面
    visaView = (info,index) =>{
        return(
            <View style={{flex:1}}>
                <Text style={{color:'#333',fontSize:16,marginBottom:8,fontWeight:'bold'}}>签证</Text>
                <Text style={{color:'#333',fontSize:16}}>{info.Intro}</Text>
                <Text style={{color:'#666',marginTop:8}}>{"下单时间:"+
                    info.CreateTime.substring(0,16).replace("T"," ")}</Text>
                <Text style={{color:'#666',marginTop:3}}>{"最多停留时间:"+info.Visa.StopMaxDay+
                    "    有效期:"+info.Visa.ValidDay}</Text>
            </View>
        );
    }

    //电话卡样式页面
    phoneCadeView = (info,index) =>{
        return(
            <View style={{flex:1}}>
                <Text style={{color:'#333',fontSize:16,marginBottom:8,fontWeight:'bold'}}>电话卡</Text>
                <Text style={{color:'#333',fontSize:16}}>{info.Intro}</Text>
                <Text style={{color:'#666',marginTop:8}}>{"启用时间:"+
                        (info.DepartureDate?info.DepartureDate.substring(0,10):'')}</Text>
            </View>
        );
    }

    //旅客信息展示View
    passengersItemView = (val,i) =>{
        let ptn = '';
        for(var v of proofType){
            if(v.TypeCode == val.CertType){
                ptn = v.Name;
                break;
            }
        }
        return(
            <View key={i} style={{flexDirection:'row',paddingTop:10,paddingBottom:10,
                borderTopColor:'#ebebeb',borderTopWidth:.8}}>
                <View style={{width:22,height:22,borderRadius:11,backgroundColor:'#ebebeb',
                    alignItems:'center',justifyContent:'center',marginRight:10}}>
                    <Text style={{fontSize:14,color:'#333'}}>{i+1}</Text>
                </View>
                <View style={{flex:1}}>
                    <View style={{flexDirection:'row',marginBottom:5}}>
                        <Text style={{flex:1.3,fontSize:15,color:'#999'}}>乘机人姓名</Text>
                        <Text style={{flex:2,fontSize:15,color:'#333'}}>{val.Name}</Text>
                    </View>
                    <View style={{flexDirection:'row',marginBottom:5}}>
                        <Text style={{flex:1.3,fontSize:15,color:'#999'}}>乘机人类型</Text>
                        <Text style={{flex:2,fontSize:15,color:'#333'}}>{val.Type=="ADT"?
                            '成人':val.Type=="CHD"?'儿童':'婴儿'}</Text>
                    </View>
                    <View style={{flexDirection:'row',marginBottom:5}}>
                        <Text style={{flex:1.3,fontSize:15,color:'#999'}}>证件类型</Text>
                        <Text style={{flex:2,fontSize:15,color:'#333'}}>{ptn}</Text>
                    </View>
                    <View style={{flexDirection:'row',marginBottom:5}}>
                        <Text style={{flex:1.3,fontSize:15,color:'#999'}}>证件号码</Text>
                        <Text style={{flex:2,fontSize:15,color:'#333'}}>{val.CertNr}</Text>
                    </View>
                    <View style={{flexDirection:'row',marginBottom:5}}>
                        <Text style={{flex:1.3,fontSize:15,color:'#999'}}>证件有效期</Text>
                        <Text style={{flex:2,fontSize:15,color:'#333'}}>{val.CertValid}</Text>
                    </View>
                </View>
            </View>
        );
    }

    //计算天数差的函数，通用  
    DateDiff = (startDate, endDate) => {    //sDate1和sDate2是2006-12-18格式  
        var startTime = new Date(Date.parse(startDate.replace(/-/g, "/"))).getTime();
        var endTime = new Date(Date.parse(endDate.replace(/-/g, "/"))).getTime();
        var dates = Math.abs((startTime - endTime)) / (1000 * 60 * 60 * 24);
        return dates;
    }

}

const styles = StyleSheet.create({
})

const SourceStatuss = [
    {
        "ID": 1,
        "CName": "订单提交成功",
        "EName": "Submit success"
      },
      {
        "ID": 2,
        "CName": "待审批",
        "EName": "Waiting to examine and approve"
      },
      {
        "ID": 3,
        "CName": "待付款",
        "EName": "Waiting to pay"
      },
      {
        "ID": 4,
        "CName": "线下支付",
        "EName": "Off-line pay"
      },
      {
        "ID": 5,
        "CName": "待出票",
        "EName": "Waiting to ticket"
      },
      {
        "ID": 6,
        "CName": "审批通过",
        "EName": "Pass the examination and approval"
      },
      {
        "ID": 7,
        "CName": "审批拒绝",
        "EName": "No pass  the examination and approval"
      },
      {
        "ID": 8,
        "CName": "支付失败",
        "EName": "Payment failed"
      },
      {
        "ID": 9,
        "CName": "支付成功",
        "EName": "Payment success"
      },
      {
        "ID": 10,
        "CName": "转人工出票",
        "EName": "Turn manual to ticket"
      },
      {
        "ID": 11,
        "CName": "已出票",
        "EName": "Ticket"
      },
      {
        "ID": 12,
        "CName": "申请取消",
        "EName": "Applying cancellation"
      },
      {
        "ID": 13,
        "CName": "申请退改签",
        "EName": "Applying refund and endorse"
      },
      {
        "ID": 14,
        "CName": "已取消",
        "EName": "Cancelled"
      },
      {
        "ID": 15,
        "CName": "订座失败",
        "EName": "Seat reservation failed"
      },
      {
        "ID": 16,
        "CName": "提交预订",
        "EName": "Submit booking"
      },
      {
        "ID": 17,
        "CName": "改签中",
        "EName": "Endorsing"
      },
      {
        "ID": 18,
        "CName": "改签完成",
        "EName": "Endorsement  finished"
      },
      {
        "ID": 19,
        "CName": "退款中",
        "EName": "Refunding"
      },
      {
        "ID": 20,
        "CName": "退款完成",
        "EName": "Refund completed"
      },
      {
        "ID": 21,
        "CName": "待订座",
        "EName": "Waiting to ticket reservation"
      },
      {
        "ID": 22,
        "CName": "座位后补",
        "EName": "Seat candidating"
      },
      {
        "ID": 23,
        "CName": "座位确认",
        "EName": "Seat confirmed"
      },
      {
        "ID": 24,
        "CName": "报价待确认",
        "EName": "Waiting to confirm quoted price"
      },
      {
        "ID": 25,
        "CName": "报价已确认",
        "EName": "Quoted price confirmed"
      },
      {
        "ID": 26,
        "CName": "出票中",
        "EName": "Ticketing"
      },
      {
        "ID": 27,
        "CName": "已付订金",
        "EName": "Paid deposit"
      },
      {
        "ID": 28,
        "CName": "已付款",
        "EName": "Paid"
      },
      {
        "ID": 29,
        "CName": "已完成",
        "EName": "Completed"
      },
      {
        "ID": 30,
        "CName": "保险待提交",
        "EName": "Waiting to submit insurance"
      },
      {
        "ID": 31,
        "CName": "保险已提交",
        "EName": "Submitted insurance"
      },
      {
        "ID": 32,
        "CName": "申请理赔",
        "EName": "Claiming for compensation"
      },
      {
        "ID": 33,
        "CName": "理赔完成",
        "EName": "Claim completed"
      },
      {
        "ID": 34,
        "CName": "客户资料待提交",
        "EName": "Waiting to submit customer information"
      },
      {
        "ID": 35,
        "CName": "客户资料已提交",
        "EName": "Submitted customer information"
      },
      {
        "ID": 36,
        "CName": "已送签",
        "EName": "Sent to sign"
      },
      {
        "ID": 37,
        "CName": "签证通过",
        "EName": "Visa passed"
      },
      {
        "ID": 38,
        "CName": "签证拒签",
        "EName": "Visa refused"
      },
      {
        "ID": 39,
        "CName": "配送中",
        "EName": "Delivering"
      },
      {
        "ID": 40,
        "CName": "配送完成",
        "EName": "Delivery completed"
      },
      {
        "ID": 41,
        "CName": "报价确认失败",
        "EName": "Quotation confirmation failed"
      },
      {
        "ID": 42,
        "CName": "租车已提交",
        "EName": "Rent car submitted"
      },
      {
        "ID": 43,
        "CName": "租车待提交",
        "EName": "Waiting to submit rent car"
      },
      {
        "ID": 44,
        "CName": "草拟中",
        "EName": "Drafting"
      },
      {
        "ID": 45,
        "CName": "取消中",
        "EName": "Cancelling"
      },
      {
        "ID": 46,
        "CName": "审批中",
        "EName": "Approving"
      },
      {
        "ID": 47,
        "CName": "留用票",
        "EName": ""
      },
      {
        "ID": 48,
        "CName": "改签失败",
        "EName": "Endorsement failed"
      },
      {
        "ID": 49,
        "CName": "退票失败",
        "EName": "Refund failed"
      },
      {
        "ID": 50,
        "CName": "退票成功",
        "EName": "RefundTicket completed"
      },
      {
        "ID": 51,
        "CName": "退票中",
        "EName": ""
      },
      {
        "ID": 52,
        "CName": "员工代扣",
        "EName": ""
      }
];