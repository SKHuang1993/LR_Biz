import React, {Component} from 'react';
import {
	StyleSheet,
	View,
    Text,
    Dimensions,
    ListView,
    ScrollView,
    TouchableOpacity,
    Platform,
    BackHandler,
    TextInput,
} from 'react-native';
import {Tabs,Toast,Popup,} from 'antd-mobile';
import YQFNavBar from '../../components/yqfNavBar';
import {COLORS} from '../../styles/commonStyle';
import{ RestAPI } from '../../utils/yqfws';
import ItineraryOrderItem from './ItineraryOrderItem';
import moment from 'moment';
import NoDataTip from '../../../components/noDataTip/index';
import OrderDetail from './orderDetail';
import MyOrderDetail from './myOrderDetail';

const TabPane = Tabs.TabPane;
var {width,height} = Dimensions.get('window')
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();


export default class ItineraryOrder  extends Component {
    constructor(props){
        super(props);
        this.state = {
            time:'',
            personCode:'',
             //全部订单listview关联的数据
            toTravelData: new ListView.DataSource({
                 rowHasChanged: (row1, row2) => row1 !== row2,
             }),
             //待审批订单listview关联的数据
             alreadyTravelData: new ListView.DataSource({
                 rowHasChanged: (row1, row2) => row1 !== row2,
             }),
             account:this.props.AccountNo,
             companyCode:'',
             activityKeyNum:'1',
             isTriped:true,//已出行
             isTrip:true,//待出行
             isRefresh:true,
             isRefreshed:true,
             isVisTitle:this.props.Visible,
             count:0,

             travelDataNum:0,
             travelDataList:[],
             alreadyDataNum:0,
             alreadyDataList:[],

             travelDataTotal:0,
             alreadyDataTotal:0,

             travelDataLongTime:true,
             aleadyDataLongTime:true,
        }
    }

    componentDidMount(){
        storage.load({ key: 'BIZACCOUNTINFO' }).then(val => {
            if (val != null) {
                this.state.personCode = JSON.parse(val).MyInfo.Result.Account.PersonCode;
                this.state.companyCode = JSON.parse(val).MyInfo.Result.Company.CompanyCode;
                this.state.account = JSON.parse(val).MyInfo.Result.Account.AccountNo;
                this.getToTravelInfo(false);
                this.getAlreadyTravelInfo(false);
            }
        }).catch(err => {
            console.log(err)
        });
        
    }

    render(){
        return(
            <View style={{flex:1,backgroundColor:'#fff'}}>
                <YQFNavBar navigator={this.props.navigator} title={lan.myTrip}
                    leftIcon={'0xe183'}
                    onLeftClick={()=>{
                        this.props.navigator.pop();
                    }} 
                />
                
                <Tabs activeKey={this.state.activityKeyNum} textColor='#999' defaultActiveKey={this.state.activityKeyNum}
                      animated={true} activeTextColor="#333" style={{backgroundColor:'#fff'}}
                      activeUnderlineColor={COLORS.btnBg} onChange={(key)=>this.tabsClickEvent(key)}>
                    <TabPane tab={lan.toTravel} key="1">
                        {this.state.isTrip ?
                        <View style={{backgroundColor:COLORS.containerBg}}>
                            <ListView
                                enableEmptySections = {true}
                                style={{height:height}}
                                dataSource={this.state.toTravelData}
                                renderRow={(rowData,sectionId,rowId)=>this.setTravelView(rowData)}
                                onEndReached={()=>{
                                    if(this.state.travelDataList.length<this.state.travelDataTotal)
                                        this.getToTravelInfo(!this.state.travelDataLongTime)
                                }}
                                onEndReachedThreshold={10}  
                            />
                        </View>
                        : this.state.travelDataLongTime? 
                        <View style={{alignItems:'center',justifyContent:'center',height:height-50}}>
                            <Text>没有7天内的行程数据，是否需要加载7天后的数据</Text>
                            <TouchableOpacity style={{height:45,width:180,borderRadius:8,marginTop:8,
                                alignItems:'center',justifyContent:'center',backgroundColor:'#159E7D'}} 
                                onPress={()=>{
                                    this.state.travelDataNum = 0;
                                    this.state.travelDataLongTime = false;
                                    this.getToTravelInfo(true);
                                }}>
                                <Text style={{color:'#fff',fontSize:16}}>加载</Text>
                            </TouchableOpacity>
                        </View>:
                        <View style={{backgroundColor:COLORS.containerBg}}>
                            <NoDataTip noDataState={4} />
                            <View style={{backgroundColor:COLORS.containerBg,height:500}}></View>
                        </View>
                        }
                    </TabPane>
                    <TabPane tab={lan.alreadyTravel} key="2">
                        {this.state.isTriped?
                        <View style={{backgroundColor:COLORS.containerBg}}>
                            <ListView
                                enableEmptySections = {true}
                                dataSource={this.state.alreadyTravelData}
                                renderRow={(rowData,sectionId,rowId)=>this.setTravelView(rowData)}
                                onEndReached={()=>{
                                    if(this.state.alreadyDataList.length<this.state.alreadyDataTotal)
                                        this.getAlreadyTravelInfo(!this.state.aleadyDataLongTime)
                                }}
                                onEndReachedThreshold={10}  
                            />
                        </View>
                        :this.state.aleadyDataLongTime? 
                        <View style={{alignItems:'center',justifyContent:'center',height:height-50}}>
                            <Text>没有7天内的行程数据，是否需要加载7天前的数据</Text>
                            <TouchableOpacity style={{height:45,width:180,borderRadius:8,marginTop:8,
                                alignItems:'center',justifyContent:'center',backgroundColor:'#159E7D'}} 
                                onPress={()=>{
                                    this.state.alreadyDataNum = 0;
                                    this.state.aleadyDataLongTime = false;
                                    this.getAlreadyTravelInfo(true);
                                }}>
                                <Text style={{color:'#fff',fontSize:16}}>加载</Text>
                            </TouchableOpacity>
                        </View>:
                        <View style={{backgroundColor:COLORS.containerBg}}>
                            <NoDataTip noDataState={4} />
                            <View style={{backgroundColor:COLORS.containerBg,height:500}}></View>
                        </View>}
                    </TabPane>
                </Tabs>
            </View>
        );
    }

    //获取待出行行程单信息
    getToTravelInfo = (isLong) =>{
        this.state.travelDataNum++;
        let endTime = '2028-12-31';//isLong?'2028-12-31':moment().add(10,'days').calendar().replace("年","-").replace("月","-").replace("日","");
        let startTime = moment().format();
        let param = {
            //"BookerID": this.state.account,//"NE300V43",//
            // "BookerCompanyCode": this.state.companyCode,
            // "PassengerCode":this.state.personCode,
            "UserCode":this.state.account,
            "ProductCategoryID": "2,3,8,9",
            "PageSize": 10,
            "PageCount": this.state.travelDataNum,
            "IsPassengerOutTicket": true,
            "StartDate": startTime,
            "EndDate": endTime
        }
        Toast.loading(lan.loading,180,()=>{
             Toast.info(lan.loadingFail, 3, null, false);
        });
        RestAPI.invoke("ABIS.CustomerJourneyByConditionGet",JSON.stringify(param),(value)=>{
            let orderInfo = value;
            if(orderInfo.Code == 0){
                this.state.count++;
                this.state.travelDataTotal = orderInfo.Result.RowCount;
                if(orderInfo.Result.RowCount != 0){
                    this.state.isTrip = true;
                    let ds = new ListView.DataSource({
                        rowHasChanged: (row1, row2) => row1 !== row2,
                    });
                    for(var _v of orderInfo.Result.JourneyInfos)
                        this.state.travelDataList.splice(this.state.travelDataList.length,0,_v);
                    this.state.toTravelData = ds.cloneWithRows(this.state.travelDataList);
                    if(this.state.count >= 2){
                        Toast.hide();
                        this.setState({});
                    }
                }else{
                    this.state.isTrip = false;
                    if(this.state.count >= 2){
                        Toast.hide();
                        this.setState({});
                    }
                } 
            }else{
                this.state.count++;
                Toast.hide();
                Toast.info(value, 5, null, false);
            }
        },(err)=>{
            this.state.count++;
            Toast.hide();
            Toast.info(err,3,null,false);
        })
    }

    //获取已出行行程单信息
    getAlreadyTravelInfo = (isLong) =>{
        this.state.alreadyDataNum++;
        let endTime = moment().format();
        let startTime = '2010-01-01';//isLong?'2010-01-01':moment().subtract(10,'days').calendar().replace("年","-").replace("月","-").replace("日","");
        let param = {
            //"BookerID": this.state.account,//"NE300V43",//
            // "BookerCompanyCode": this.state.companyCode,
            // "PassengerCode":this.state.personCode,
            "UserCode":this.state.account,
            "ProductCategoryID": "2,3,8,9",
            "PageSize": 10,
            "PageCount": this.state.alreadyDataNum,
            "IsPassengerOutTicket": true,
            "StartDate": startTime,
            "EndDate": endTime,
            "IsDesc":true
        }
        Toast.loading(lan.loading,180,()=>{
             Toast.info(lan.loadingFail, 3, null, false);
        });
        RestAPI.invoke("ABIS.CustomerJourneyByConditionGet",JSON.stringify(param),(value)=>{
            let orderInfo = value;
            if(orderInfo.Code == 0){
                Toast.hide();
                this.state.count++;
                this.state.alreadyDataTotal = orderInfo.Result.RowCount;
                if(orderInfo.Result.RowCount != 0){
                    this.state.isTriped = true;
                    let ds = new ListView.DataSource({
                        rowHasChanged: (row1, row2) => row1 !== row2,
                    });
                    for(var _v of orderInfo.Result.JourneyInfos)
                        this.state.alreadyDataList.splice(this.state.alreadyDataList.length,0,_v);
                    this.state.alreadyTravelData = ds.cloneWithRows(this.state.alreadyDataList);
                    if(this.state.count >= 2){
                        Toast.hide();
                        this.setState({});
                    }
                }
                else{
                    Toast.hide();
                    this.state.isTriped = false;
                    if(this.state.count >= 2){
                        Toast.hide();
                        this.setState({});
                    }
                } 
            }else{
                this.state.count++;
                Toast.info(value, 5, null, false);
            }
        },(err)=>{
            this.state.count++;
            Toast.hide();
            Toast.info(err,3,null,false);
        })
    }

    setTravelView = (value) =>{
        return (
            <TouchableOpacity onPress={()=>this.toOrderDetail(value)}>
                <ItineraryOrderItem navigator={this.props.navigator} OrderInfo={value}/>
            </TouchableOpacity>
        );
    }

    //Tabs点击回调时间
    tabsClickEvent = (key) => {
        let ds = new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
        });        
        if(key == '1'){
            this.state.activityKeyNum = '1';
            // this.setState({
            //     activityKeyNum:'1',
            //     toTravelData:ds.cloneWithRows([]),
            // });
            // this.state.activityKeyNum = '1';
            // this.state.toTravelData = ds.cloneWithRows([]);
            
            // this.getToTravelInfo();
        } else if(key == '2') {
            // this.setState({});
            this.state.activityKeyNum = '2';
            // this.state.alreadyTravelData = ds.cloneWithRows([]);
            // this.getAlreadyTravelInfo();
        }
    }

    //JSon转为map
    jsonToMap = (jsonStr) => {
            JsonUitl.objToStrMap(JSON.parse(jsonStr));
    }
    objToStrMap = (obj) => {
        let strMap = new Map();
        let map = new Map()
        for (let jou of Object.keys(obj)) {
            for(let k of Object.keys(jou)){
                let param = {
                    "CarrierCode": k.CarrierAirline,
                }
                RestAPI.invoke("Base.AirlineGet",JSON.stringify(param),(va)=>{
                    let pInfo = va;
                    if(pInfo.Code == 0){
                        k.CarrierAirline = v.CarrierAirline+"&"+pInfo.Result.Airline.ShortName;
                        // this.state.airName = pInfo.Result.ShortName;
                    }else{
                        Toast.info(va, 3, null, false);
                    }
                    map.set(k,obj[k])
                },(err)=>{
                    Toast.info(err,3,null,false);
                })
            }
            strMap.set(jou,obj[jou]);
        }
        alert(strMap);
        // return strMap;
    }

    toOrderDetail = (v) => {
        let storage = global.storage;
        storage.load({ key: 'BIZACCOUNTINFO' }).then(val =>{
            if(val!=null){
                let userInfo = JSON.parse(val);
                this.state.LoginAccount = (userInfo.Phone == null || userInfo.Phone == '') ? 
                                                    userInfo.Email : userInfo.Phone;
                this.state.AccountNo = userInfo.Account;
                this.props.navigator.push({
                    name: 'MyOrderDetail',
                    component: MyOrderDetail,
                    passProps:{
                        OrderId:v.SOShortNr,
                        BookerID:v.BookerID,
                        LoginAccount:(userInfo.Phone == null || userInfo.Phone == '') ? 
                                        userInfo.Email : userInfo.Phone,
                        AccountNo:userInfo.Account,
                        // RefreshEvent:()=>{}
                    }
                });
            }
        }).catch(err => {
                console.log(err)
        });
    }
}