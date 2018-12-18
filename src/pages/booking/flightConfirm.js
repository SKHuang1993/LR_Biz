import { BaseComponent } from '../../components/locale';
let lan = BaseComponent.getLocale();
import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    Platform,
    StatusBar,
    ScrollView,
    Navigator,
    ListView,
    TouchableOpacity,
    TouchableHighlight,
    Animated, TextInput, Alert, WebView
} from 'react-native';

import { WhiteSpace, Popup } from 'antd-mobile';
import ActivityIndicator from '../../components/activity-indicator';
import Flex from '../../components/flex';
import List from '../../components/list';
import TextareaItem from '../../components/textarea-item';
import NavBar from '../../components/navBar';
import Icon from '../../components/icons/icon';
import { COLORS, FLEXBOX } from '../../styles/commonStyle'
import Button from '../../components/button';
import Booking from '../../pages/booking/index'
import Accordion from 'react-native-collapsible/Accordion';
import { observer } from 'mobx-react/native';
import ToolBar from '../../components/toolBar/';
import FlightList from '../../components/booking/flightList';
import FlightInfo from '../../components/booking/flightInfo';
import FormatPrice from '../../components/formatPrice';
import Enumerable from 'linq';
import PriceBar from '../../components/price-bar';
import Form from '../../components/form/';
import Modal from '../../components/modal';
import Picker from '../../components/picker';
import Confirm from './';
import { extendObservable, action, computed, toJS, observable } from 'mobx';
import HTMLView from 'react-native-htmlview';
import FlightConfirm from '../../stores/booking/flight-confirm';
const Item = List.Item;
const Brief = Item.Brief;


const alert = Modal.alert;
@observer
export default class Index extends Component {
    constructor(props) {
        super(props);
        this.store = new FlightConfirm();
        this.store.data = this.props.data;
        this.store.flights = this.props.selectedFlights;
    }

    componentDidMount() {
        // if (this.props.store)
        //     this.store = this.props.store;
    }

    //航节提示
    getLeg = (position) => {
        if (this.props.param) {
            if (this.props.param.departureDates.length <= 2) {
                return position == 0 ? lan.booking_go : lan.booking_return;
            }
            else {
                return position + 1;
            }
        }
    }

    getLegTip = (position) => {
        if (this.props.param.departureDates.length <= 2) {
            return position == 0 ? lan.booking_go : lan.booking_return;
        }
        else {
            return lan.booking_no + (position + 1) + lan.booking_cheng;
        }
    }

    //航班信息
    getFlightInfo = (leg, info) => {
        return {
            //标题
            title: {
                leg: leg,
                date: info.DepartureDate,
                city: `${info.Departure.cityNameCn} - ${info.Arrival.cityNameCn}`,
            },
            //列表
            list: Enumerable.from(info.Segment.ClassAvail).select('$.Flight').toArray()
        }
    }

    //舱位信息(国内)
    getCabinInfo = (info, flightInfo) => {
        return {
            CabinName: info.CabinName,
            DiscountRate: info.DiscountRate,
            Price: info.Price,
            ExtraPrice: `${lan.flights_enginePlusFuel}:￥50`
        }
    }

    //舱位信息(国际)
    getInlCabinInfo = (info, flightInfo) => {
        return {
            CabinName: info.CabinName,
            DiscountRate: info.DiscountRate,
            Price: flightInfo.TotalPrice,
            ExtraPrice: `${lan.booking_ticket_price}￥${flightInfo.Price} ${lan.booking_taxation}￥${flightInfo.Tax}`
        }
    }

    getSeatsInfo = (num) => {
        // let sum = Enumerable.from(flights).sum(o => Enumerable.from(o.Segment.ClassAvail).count(o => o.Flight.Seats == 0));
        // if (sum > 0)
        //     return '无座';
        // else
        //     return '有位';
        if (num == 'A' || parseInt(num) > 5)
            return '剩5张';
        else if (parseInt(num) == 0)
            return '无座';
        else
            return `剩${num}张`;
    }

    render() {
        let ticketType = this.props.param.ticketType;
        let flightList = this.store.flights;
        return (
            <View style={styles.container}>
                <NavBar title={'航班确认'} navigator={this.props.navigator} />
                <ListView
                    enableEmptySections={true}
                    renderHeader={() =>
                        <View>
                            <View style={[styles.flights]}>
                                {flightList.map((o, i) =>
                                    <View key={i} style={styles.flightList}>
                                        <FlightList data={this.getFlightInfo(this.getLegTip(i), o)} arrow={this.props.store ? false : true} />
                                        {ticketType == 0 ? <FlightInfo data={this.getCabinInfo(o.selectedCabin, o)} endorseText={o.selectedCabin.Rule} /> : null}
                                    </View>)}
                            </View>
                            {/* 供应商 */}
                            <View style={styles.supplierHeader}><Text style={styles.supplierHeaderText}>请选择供应商</Text></View>
                        </View>}
                    dataSource={this.store.getDataSource}
                    renderRow={(rowData) => {
                        let source = rowData.source;
                        rowData = source[source.length - 1];
                        return (<View style={styles.supplier}>
                            {/* left */}
                            <View style={styles.supplierMain}>
                                <View>
                                    <Text>{FormatPrice(rowData.TotalPrice, null, 24)}<Text style={styles.supplieCaption}>&nbsp;全程含税价</Text></Text>
                                </View>
                                <View>
                                    <Text><Text style={styles.supplierInfo}>{`${rowData.AgencyCode} (${rowData.AgencyRay}) |`}</Text><Text style={styles.supplierModalBtn} onPress={async () => {
                                        this.store.loadingText = "获取退改签...";
                                        this.store.isLoading = true;
                                        let terms = await this.store.getFlightShoppingTerms(rowData.ABFareId, rowData.AgencyCode);
                                        if (!terms) terms = '退改签条款以航空公司规定为准，详情请咨询旅行顾问';
                                        this.store.isLoading = false;
                                        alert(lan.flights_ticketChangesBack, <HTMLView value={terms}></HTMLView>, [
                                            { text: lan.confirm, onPress: () => { } },
                                        ])
                                    }}>退改签</Text><Text style={styles.supplierModalBtn}>></Text></Text>
                                </View>
                                {/* <Text>{rowData.JourneyCode}</Text> */}
                                <View style={{ flexDirection: 'row' }}>
                                    {source.map((o, i) =>
                                        <Text key={i} style={styles.supplierInfo}>{this.getLegTip(i) + "：" + this.getCabinInfo(o.BerthList[0], o).CabinName + Enumerable.from(o.Segment.ClassAvail).select(o => o.Flight.FlightCOS).toArray().join('+')}</Text>)}

                                </View>
                            </View>
                            {/* right */}
                            <View style={styles.supplierBook}>
                                <TouchableOpacity activeOpacity={.8} onPress={async () => {
                                    this.store.loadingText = "正在验价...";
                                    this.store.isLoading = true;
                                    let flights = await this.store.verifyPrice([21], source, (RawData, ReturnRawData) => {
                                        this.RawData = RawData;
                                        this.ReturnRawData = ReturnRawData;
                                    });
                                    let sum = Enumerable.from(flights).sum(o => Enumerable.from(o.Segment.ClassAvail).count(o => o.Flight.Seats == 0));
                                    if (sum == 0 && flights) {
                                        this.store.loadingText = "获取退改签...";
                                        let terms = await this.store.getFlightShoppingTerms(rowData.ABFareId, rowData.AgencyCode);
                                        Enumerable.from(flights).doAction((o, i) => {
                                            o.AgencyCode = rowData.AgencyCode;
                                            if (terms) o.selectedCabin.Rule = terms;
                                        }).toArray();
                                        this.store.isLoading = false;
                                        this.props.navigator.push({
                                            component: Booking,
                                            title: lan.flights_flight_title,
                                            passProps: {
                                                toChange: this.props.toChange,
                                                orderDetail: this.props.orderDetail,
                                                routetrip: this.props.routetrip,
                                                info: this.props.info,
                                                sequence: this.props.sequence + 1,
                                                param: this.props.param,
                                                employee: this.props.employee,
                                                selectedFlights: flights,
                                                RawData: this.RawData,
                                                ReturnRawData: this.ReturnRawData
                                            }
                                        })
                                    } else {
                                        this.store.isLoading = false;
                                        let msg = lan.flights_flightNotSeat;
                                        if (!flights) msg = "抱歉,验价失败";
                                        else if (sum < Enumerable.from(flights).sum(o => o.Segment.ClassAvail.length)) {
                                            msg = lan.flights_flightNotPartSeat;
                                        }
                                        alert('', msg + ",请重新选择航班", [
                                            {
                                                text: lan.confirm, onPress: () => {

                                                }
                                            }
                                        ])
                                    }
                                }}>
                                    <View style={styles.supplierBtn}><Text style={styles.supplierBtnText}>订</Text></View>
                                    <View style={styles.supplierResidue}><Text style={styles.supplierResidueText}>{this.getSeatsInfo(rowData.Segment.ClassAvail[0].Flight.Seats)}</Text></View>
                                </TouchableOpacity>
                            </View>
                        </View>)
                    }}
                />
                <ActivityIndicator toast text={this.store.loadingText} animating={this.store.isLoading} />
            </View >
        )

    }


}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.containerBg,
    },
    flights: {
        //padding: 5,
        // backgroundColor: COLORS.primary,
    },

    flightList: {
        borderBottomWidth: 1 / FLEXBOX.pixel,
        borderBottomColor: '#ddd',
        padding: 10,
        backgroundColor: '#fff',
    },
    //列表样式
    listTitle: {
        flex: 1,
        fontSize: 16,

    },
    listWarning: {
        color: '#fa5e5b',
        fontSize: 12,
    },
    iconWarning: {
        color: '#fa5e5b',
        fontSize: 14,
        marginRight: 2,

    },
    TextWarning: {
        color: '#fa5e5b',
        fontSize: 12,
    },
    itemExtraVal: {
        fontSize: 16,
        color: '#888888'
    },
    // 结算方式
    clearingForm: {
        backgroundColor: COLORS.primary,
        padding: 5,
    },
    clearingFormTxt: {
        fontSize: 14,
        color: '#999',

    },
    //供应商
    supplier: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#fff'
    },
    supplieCaption: {
        color: '#999',
        fontSize: 12,

    },
    supplierInfo: {
        fontSize: 14,
        color: '#333',
        lineHeight: 28,
        marginRight: 4
    },
    supplierModalBtn: {
        textDecorationLine: 'underline',
        color: '#159E7D',
        fontSize: 14,
    },
    supplierBook: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#fa5e5b',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#fa5e5b'
    },
    supplierBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        width: 50
    },
    supplierResidue: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3
    },
    supplierBtnText: {
        color: '#fff',
        fontSize: 20
    },
    supplierResidueText: {
        color: '#fa5e5b',
        fontSize: 12
    },
    supplierHeader: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 9
    },
    supplierHeaderText: {
        fontSize: 14,
        color: '#888'
    },
    WebView: {
        //width: FLEXBOX.width * .65,
        height: FLEXBOX.height * .6,
    },

});