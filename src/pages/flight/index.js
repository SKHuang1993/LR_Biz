
import React, { Component } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    Image,
    Platform,
    StatusBar,
    ScrollView,
    Animated,
    Easing,
    Navigator, BackAndroid, TouchableOpacity, Alert, TouchableHighlight, InteractionManager
} from 'react-native';

import { WhiteSpace, Stepper, Popup } from 'antd-mobile';
import List from '../../components/list';
import Flex from '../../components/flex';
import NavBar from '../../components/navBar';
import Picker from '../../components/picker';
import Icon from '../../components/icons/icon';
import { COLORS, FLEXBOX } from '../../styles/commonStyle'
import Button from '../../components/button';
import TabButton from '../../components/tabButton/';
import Checkbox from '../../components/checkbox';

import SearchAirRequest from '../../stores/flight/'
import { observer } from 'mobx-react/native'
import domestic from './domestic';
import intl from './intl';
import { observable, extendObservable, toJS } from 'mobx';
import Staff from '../../pages/staff';
import Enumerable from 'linq'
import { AccountInfo, CabinInfo } from '../../utils/data-access/';
const AgreeItem = Checkbox.AgreeItem;
const CheckboxItem = Checkbox.CheckboxItem;
import { BaseComponent } from '../../components/locale';
let lan = BaseComponent.getLocale();
@observer
class Index extends Component {
    constructor(props) {
        super(props);

        this.store = new SearchAirRequest();
        this.store.processV2 = this.props.processV2;
        this.store.userInfo = AccountInfo.getUserInfo();
        //console.log(this.store.userInfo);
        this.store.staffDataMyself = {
            PersonCode: this.store.userInfo.EmpCode,
            PersonName: this.store.userInfo.EmpName,
            checked: true,
            DepartmentName: this.store.userInfo.DeptName,
            Sex: this.store.userInfo.Sex == "M" ? 0 : 1
        }
        this.state = {
            tabNames: [lan.flights_tabbar_oneway, lan.flights_tabbar_roundtrip, lan.flights_tabbar_multitrip],
            activeSwitch: '1',
            cabinVal: CabinInfo.getCabinList(),
        };
    }

    // 获取 历史容器宽度
    historyLayout = (e) => {

        this.setState({
            historyX: e.nativeEvent.layout.width - FLEXBOX.width
        })
    }

    componentDidMount() {
        // // 滚动到历史最右边
        // setTimeout(() => {
        //     this.refs.historyScrollView.scrollTo({ x: this.state.historyX, animated: false });
        //     // alert(this.state.historyX)
        // }, 300)
        if (this.props.booker) {
            this.store.forMyself = !this.store.forMyself;
            this.store.staffData.splice(0, 0, this.props.booker);
        }
        if (this.props.orderDetail) {
            this.store.request.isPrivate = this.props.orderDetail.Trade.Orders[0].TravelNatureCode == "Public" ? 0 : 1;
            this.store.toChange = this.props.toChange;
            this.store.staffData = this.props.orderDetail.Trade.Orders[0].Passengers;
            this.store.request = this.store.initCondition(this.props.orderDetail);
        }
        else if (this.props.store) {
            //参考行程
            this.routetrip = toJS(this.props.store);
            this.store.staffData.push(this.store.staffDataMyself);
            this.routetrip.departureDates = Enumerable.from(this.routetrip.departureDates).select(o => o.format("YYYY-MM-DD")).toArray();
            this.store.request = this.routetrip;
        } else
            //读取历史记录
            this.store.getHistory(this.props.isPrivate);

        if (this.props.staffData) {
            this.store.staffData = this.props.staffData;
        }
    }

    onTabClick(key) {
        this.store.request.tripType = key;
    }

    // 导航 右边内容
    navRightView() {
        return (this.props.processV2 || this.props.toChange ? null :
            <TabButton style={styles.switch}
                tabNames={[lan.onBusiness, lan.onPrivate]}
                textActiveStyle={styles.switch_txt_acitve}
                textStyle={styles.switch_txt}
                tabStyle={styles.switch_tab}
                tabActiveStyle={styles.switch_tabActive}
                radius={3}
                activeTab={this.store.request.isPrivate ? 1 : 0} onClink={(i) => this.store.request.isPrivate = i} />
        )
    }
    pushToStaff() {
        if (this.props.navigator) {
            this.props.navigator.push({
                component: Staff,
                type: 'Bottom',
                passProps: {
                    staffData: toJS(this.store.staffData),
                    productType: this.store.request.ticketType,
                    checkedData: (val) => {
                        this.store.staffData = val;
                        let index = this.store.staffData.findIndex(o => o.PersonCode == this.store.staffDataMyself.PersonCode);
                        this.store.forMyself = index != -1;
                    }
                }
            })
        }
    }

    //航班搜索
    searchFlight = () => {
        if (!this.store.request.isPrivate && this.store.staffData.length == 0) {
            Alert.alert(null, lan.flights_alert_employeeSelect, [{ text: lan.confirm }]);
            return;
        }
        if (this.store.validate()) {
            let data = this.store.dataTransfer();
            if (this.props.BTANr)
                data.BTANr = this.props.BTANr;
            // if (this.store.forMyself)
            //     this.store.getMobilePassengerByCode(this.props.booker.PersonCode);
            //国内机票查询
            if (this.store.getTicketType(data) == 0) {
                if (!this.store.toChange)
                    this.store.saveHistory(data);
                this.props.navigator.push({
                    component: domestic,
                    title: lan.flights_domesticList_title,
                    passProps: {
                        sequence: 0,
                        routetrip: this.props.store,
                        info: this.props.info,
                        param: data,
                        orderDetail: this.props.orderDetail,
                        toChange: this.props.toChange,
                        employee: this.store.staffData
                    },
                })
            }
            //国际机票查询 
            else {
                if (!this.store.toChange)
                    this.store.saveHistory(data);
                this.props.navigator.push({
                    component: intl,
                    title: lan.flights_international_title,
                    passProps: {
                        sequence: 0,
                        routetrip: this.props.store,
                        info: this.props.info,
                        param: data,
                        orderDetail: this.props.orderDetail,
                        toChange: this.props.toChange,
                        employee: this.store.staffData
                    },
                })
            }
        }
    }
    //员工信息
    getStaffData() {
        let data = [];
        this.store.staffData.map((item, index) => {
            let sym = index == 0 ? '' : '、';
            data.push(sym + item.PersonName)
        })
        return <Text style={styles.staffRightText} numberOfLines={1}>{data}</Text>
    }




    render() {
        return (
            <View style={styles.container}>

                <NavBar title={this.props.title || lan.flights} navigator={this.props.navigator} />

                {/*tabs 切换*/}
                {!this.store.toChange &&
                    <TabButton
                        tabNames={this.state.tabNames}
                        textActiveStyle={styles.tabButtonAT} style={styles.tabButton} tabItemActiveStyle={styles.tabButtonAI} textStyle={styles.tabButtonT} tabItemStyle={styles.tabButtonI}
                        activeTab={this.store.request.tripType} onClink={(i) => this.onTabClick(i)} />}
                <ScrollView style={styles.scrollView}>
                    {/*城市信息 item*/}
                    {this.store.getLegs.map((o, i) =>
                        <CitySearchItem key={i} position={i} store={this.store} />)}
                    {/*添加航段*/}
                    {this.store.request.tripType == 2 ?
                        <TouchableHighlight underlayColor={'#ffffff66'} style={styles.addLeg_btn} onPress={() => this.store.addLeg()}>
                            <View style={{ flexDirection: 'row' }}>
                                <Icon icon={'0xe680'} style={styles.addIcon} />
                                <Text style={{ color: COLORS.secondary }}>{lan.flights_addLeg}</Text>
                            </View>
                        </TouchableHighlight>
                        : null}
                    {/*选择员工*/}
                    {this.store.request.isPrivate || this.props.processV2 || this.store.toChange ? null :
                        <Flex style={[styles.box, styles.staff]}>
                            <View style={styles.staffLeft}>
                                <AgreeItem style={styles.staffItem} checked={this.store.forMyself} onChange={(event) => {
                                    this.store.forMyself = !this.store.forMyself;
                                    let index = this.store.staffData.findIndex(o => o.PersonCode == this.store.staffDataMyself.PersonCode);
                                    if (this.store.forMyself) {
                                        if (index == -1) {
                                            this.store.staffData.splice(0, 0, this.store.staffDataMyself);
                                            this.store.staffData = Enumerable.from(this.store.staffData).where(o => this.store.staffDataMyself.PolicyID == o.PolicyID).toArray();
                                        }
                                    } else {
                                        if (index != -1)
                                            this.store.staffData.remove(this.store.staffData[index]);
                                    }
                                }} >{lan.flights_book_self}</AgreeItem>
                            </View>

                            <TouchableOpacity style={styles.staffRight} activeOpacity={.7} onPress={this.pushToStaff.bind(this)} >
                                <Flex style={styles.staffRightInner}>
                                    <Text numberOfLines={1} style={styles.staffText}>{this.store.staffData.length > 0 ? this.getStaffData() : lan.flights_employeeSelect}</Text><Icon style={styles.arrowRight} icon={'0xe677'} />

                                </Flex>
                            </TouchableOpacity>

                        </Flex>}
                    {/*从通讯录选择的用户*/}
                    {this.props.booker &&
                        <Flex style={[styles.box, styles.staff]}>
                            <View style={styles.staffLeft}>
                                <AgreeItem style={styles.staffItem} checked={true} onChange={(event) => {
                                }} >{`为${this.props.booker.Name}预订`}</AgreeItem>
                            </View>

                        </Flex>}
                    <List>
                        {/*舱位*/}
                        {!this.store.toChange &&
                            <Picker
                                data={this.state.cabinVal} cols={1}
                                title={lan.flights_cabin}
                                value={[this.store.request.berthType]}
                                triggerType="onClick"
                                onChange={(v) => this.store.request.berthType = v[0]}>
                                <List.Item arrow="horizontal" last >{lan.flights_cabin}</List.Item>
                            </Picker>}
                        <List.Item
                            arrow="horizontal"
                            onClick={() => {
                                Popup.show(
                                    <PassengerSelector confirm={(adultNum, childNum) => {
                                        this.store.request.adultQty = adultNum;
                                        this.store.request.childQty = childNum;
                                    }} />,
                                    {
                                        maskClosable: true,
                                        animationType: 'slide-up',
                                        onMaskClose: () => { }
                                    }
                                )
                            }}
                            extra={<Text style={{ fontSize: 16 }}>{`${this.store.request.adultQty}成人${this.store.request.childQty}儿童`}</Text>}
                        >乘客
                        </List.Item>



                    </List>
                    {/*按钮*/}
                    <Button style={styles.confirmBtn} textStyle={styles.confirmBtnTxt} onClick={() => this.searchFlight()}>{lan.search}</Button>
                    {/*搜索历史*/}
                    {this.routetrip || this.store.toChange ? null :
                        <ScrollView ref='historyScrollView' horizontal={true}
                            showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', }} onLayout={this.historyLayout}  >
                                {this.store.records.map((o, i) => <TouchableOpacity key={i} onPress={() => {
                                    this.store.setCurrentHistory(o, this.props.isPrivate);
                                }}>
                                    <Text style={styles.record_item}>{this.store.getHistoryItemText(o)}</Text>
                                </TouchableOpacity>)}
                            </View>
                        </ScrollView>}
                    {this.store.records.length > 0 && !this.routetrip && !this.store.toChange ?
                        <TouchableOpacity onPress={() => this.store.clearHistory()} style={styles.clear_record_btn}>
                            <Text style={{ color: '#66666666', fontSize: 14 }}>{lan.flights_clearHistory}</Text>
                        </TouchableOpacity> : null}
                </ScrollView>
            </View>
        )
    }
}

@observer
class CitySearchItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            departX: new Animated.Value(0),
            arriveX: new Animated.Value(0),
        }
    }

    changeAnimated = () => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(this.state.departX, {
                    toValue: 1,
                    duration: 0,
                    //easing: Easing.linear
                }),
                Animated.spring(this.state.arriveX, {
                    toValue: 1,
                    duration: 0,
                    //easing: Easing.linear
                })
            ]),
            //  Animated.delay(0), // 延迟400ms，配合sequence使用
            // Animated.parallel([
            //     Animated.spring(this.state.departX, {
            //         toValue: 0,
            //         duration: 0,
            //        // easing: Easing.linear
            //     }),
            //     Animated.spring(this.state.arriveX, {
            //         toValue: 0,
            //         duration: 10,
            //        // easing: Easing.linear
            //     })
            // ]),
        ]).start(() => {

            // 快速拉回到初始状态
            this.state.departX.setValue(0)
            this.state.arriveX.setValue(0)

        }

        );
    }


    render() {
        let position = this.props.position;
        let store = this.props.store;
        // 城市标题
        function cityTitle(v = 'depart') {
            let style1 = v == 'depart' ? FLEXBOX.flexEnd : FLEXBOX.flexStart;
            let style2 = v == 'depart' ? styles.cityView_left : styles.cityView_right;
            let title = v == 'depart' ? lan.departureCity : lan.arrivalCity;
            let icon = v == 'depart' ? '0xe67d' : '0xe67b';
            return (<View style={[style1, style2, styles.iconText, styles.cityIconText]}>
                <Icon icon={icon} style={[styles.cityIcon]} />
                <Text style={styles.cityTitle}>
                    {title}</Text>
            </View>)
        }

        return (<View>
            {/*移除航段*/}
            <Flex justify='between' style={position != 0 ? { marginTop: 10 } : null}>
                {store.request.tripType == 2 ? <Text style={styles.legTitle}>{lan.leg}{position + 1}</Text> : null}
                {store.request.departures.length > 1 && store.request.tripType == 2 ?
                    <TouchableOpacity style={{ marginBottom: 5 }} onPress={() => store.removeLeg(position)}>
                        <Icon icon={'0xe67c'} style={styles.delIcon} />
                    </TouchableOpacity> : null}
            </Flex>

            {/*目的地*/}
            <View style={[styles.box, styles.cityView]}>
                <Flex style={{ overflow: 'hidden' }}>
                    {/*去程*/}
                    <Animated.View style={[styles.cityView_left, {
                        // backgroundColor: 'orange',
                        transform: [
                            {
                                translateX: this.state.departX.interpolate({
                                    inputRange: [0, .5, 1],
                                    outputRange: [0, FLEXBOX.width / 2, 0]
                                })

                            }
                        ],
                        opacity: this.state.departX.interpolate({
                            inputRange: [0, .2, .5, .8, 1],
                            outputRange: [1, .2, 0, .2, 1]
                        })
                    }]}>
                        <TouchableOpacity activeOpacity={0.6} style={[styles.cityView_left]} disabled={store.processV2 || store.toChange} onPress={() => store.setDepartures(position, 0)}>
                            {position < store.request.departures.length ?
                                <Text numberOfLines={1} style={[styles.cityVal, styles.cityVal_left,]}>
                                    {lan.lang == "ZH" ? store.request.departures[position].cityName : store.request.departures[position].cityCode}
                                </Text>
                                :
                                <Text numberOfLines={1} style={[styles.cityVal, styles.cityVal_left, { color: '#dcdcdc' }]}>
                                    {lan.origin}
                                </Text>
                            }
                        </TouchableOpacity>
                    </Animated.View>


                    <TouchableOpacity activeOpacity={0.6} style={[styles.cityView_center]} onPress={() => {
                        //目的地互换(无动画)
                        if (position < store.request.departures.length && position < store.request.arrivals.length) {
                            let v1 = store.request.departures[position];
                            store.request.departures[position] = store.request.arrivals[position];
                            store.request.arrivals[position] = v1;
                            //动画函数
                            this.changeAnimated();
                        }

                    }}>
                        <Icon icon={'0xe67e'} style={styles.cityTurn} />
                    </TouchableOpacity>

                    {/*回程*/}
                    <Animated.View style={[styles.cityView_right, {
                        //  backgroundColor: 'orange',

                        transform: [
                            {
                                translateX: this.state.arriveX.interpolate({
                                    inputRange: [0, .5, 1],
                                    outputRange: [0, -FLEXBOX.width / 2, 0]
                                })

                            }
                        ],
                        opacity: this.state.arriveX.interpolate({
                            inputRange: [0, .2, .5, .8, 1],
                            outputRange: [1, .2, 0, .2, 1]
                        })
                    }]}>
                        <TouchableOpacity activeOpacity={0.6} disabled={store.processV2 || store.toChange} onPress={() => store.setDepartures(position, 1)}>
                            {position < store.request.arrivals.length ?
                                <Text numberOfLines={1} style={[styles.cityVal, styles.cityVal_right,]}>
                                    {lan.lang == "ZH" ? store.request.arrivals[position].cityName : store.request.arrivals[position].cityCode}
                                </Text>
                                :

                                <Text numberOfLines={1} style={[styles.cityVal, styles.cityVal_right, { color: '#dcdcdc' }]}>

                                    {lan.destination}
                                </Text>}
                        </TouchableOpacity>
                    </Animated.View>


                </Flex>
                {/*由于安卓端内容溢出不能显示bug导致切换动画问题，布局重新规划*/}
                <Flex>
                    {/*去程*/}
                    <TouchableOpacity style={[FLEXBOX.flexEnd, styles.cityView_left, styles.iconText,]} disabled={store.processV2 || store.toChange} activeOpacity={0.6} onPress={() => store.setDepartures(position, 0)}>

                        {cityTitle('depart')}
                    </TouchableOpacity>
                    <View style={[styles.cityView_center]} ></View>
                    {/*回程*/}
                    <TouchableOpacity style={[FLEXBOX.flexStart, styles.cityView_left, styles.iconText,]} disabled={store.processV2 || store.toChange} activeOpacity={0.6} onPress={() => store.setDepartures(position, 1)}>

                        {cityTitle('arrive')}
                    </TouchableOpacity>

                </Flex>


            </View>
            {/*日期*/}
            <Flex wrap="wrap" justify='between' style={[styles.box, styles.dateView]}>
                <TouchableOpacity activeOpacity={0.6} style={styles.dateView_left} onPress={() => store.setDepartureDates(position, 0)}>
                    <Text style={styles.dateView_title}>
                        {lan.departureDate}
                    </Text>
                    <View style={[FLEXBOX.flexStart, styles.iconText]}>
                        <Icon icon={'0xe67f'} style={styles.dateIcon} />
                        <Text style={styles.dateVal}>
                            {store.request.departureDates[position]}
                        </Text>
                    </View>
                </TouchableOpacity>
                {store.request.tripType == 1 ?
                    <TouchableOpacity activeOpacity={0.6} style={styles.dateView_right} onPress={() => store.setDepartureDates(position, 1)}>
                        <Text style={styles.dateView_title}>
                            {lan.returnDate}
                        </Text>
                        <View style={[FLEXBOX.flexStart, styles.iconText]}>
                            <Icon icon={'0xe67f'} style={styles.dateIcon} />
                            <Text style={styles.dateVal}>
                                {store.request.departureDates[position + 1]}
                            </Text>
                        </View>
                    </TouchableOpacity> : null}
            </Flex>
        </View>

        )
    }
}

//选择乘客 搬目的地
@observer
class PassengerSelector extends Component {
    @observable adultNum = 1;
    @observable childNum = 0;
    constructor(props) {
        super(props);
    }
    render() {
        return (<View style={{ height: FLEXBOX.height }} >

            <NavBar leftText={'取消'} title={'选择乘客'} rightText={'确定'} onLeftClick={() => Popup.hide()} onRightClick={() => {
                Popup.hide();
                this.props.confirm(this.adultNum, this.childNum);
            }} />

            <List>
                <List.Item extra={<View style={styles.stepListItem}>
                    <TouchableOpacity activeOpacity={.6} style={[styles.stepper, styles.stepWrap, this.adultNum > 1 && this.childNum <= (this.adultNum - 1) * 2 ? null : styles.stepDisabled]} onPress={() => {
                        if (this.adultNum > 1 && this.childNum <= (this.adultNum - 1) * 2)
                            this.adultNum -= 1;
                    }}><Text style={styles.stepText}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.inp}><Text style={styles.inpText}>{this.adultNum}</Text></View>
                    <TouchableOpacity activeOpacity={.6} style={[styles.stepper, styles.stepWrap, this.adultNum + this.childNum < 9 ? null : styles.stepDisabled]} onPress={() => {
                        if (this.adultNum + this.childNum < 9)
                            this.adultNum += 1;
                    }}><Text style={styles.stepText}>+</Text></TouchableOpacity>
                </View>}>成人（12岁以上）</List.Item>

                <List.Item extra={<View style={styles.stepListItem}>
                    <TouchableOpacity activeOpacity={.6} style={[styles.stepper, styles.stepWrap, this.childNum > 0 ? null : styles.stepDisabled]} onPress={() => {
                        if (this.childNum > 0)
                            this.childNum -= 1;
                    }}><Text style={styles.stepText}>-</Text></TouchableOpacity>
                    <View style={styles.inp}><Text style={styles.inpText}>{this.childNum}</Text></View>
                    <TouchableOpacity activeOpacity={.6} style={[styles.stepper, styles.stepWrap, this.adultNum + this.childNum < 9 && this.childNum < this.adultNum * 2 ? null : styles.stepDisabled]} onPress={() => {
                        if (this.adultNum + this.childNum < 9 && this.childNum < this.adultNum * 2)
                            this.childNum += 1;
                    }}><Text style={styles.stepText}>+</Text></TouchableOpacity>
                </View>}>儿童（2-11岁）</List.Item>

                <List.Item wrap>
                    <View>
                        <Text style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>
                            注：无成人陪伴儿童或两岁以下婴儿请致电4000-678-6622人工预订！
                                            </Text>
                    </View>
                </List.Item>
            </List>
        </View>);
    }
}

//选择乘客
@observer
class PassengersNumber extends Component {
    constructor(props) {
        super(props);
        this.state = {
            adultVal: 1,
            childrenVal: 0
        }
    }

    onChangeAdult = (val) => {
        //console.log(val);
        this.setState({ adultVal: val });
    }
    onChangeChildren = (val) => {
        //console.log(val);
        this.setState({ childrenVal: val });
    }
    render() {
        return <View style={{ height: FLEXBOX.height }}>
            <NavBar leftText={lan.cancel} title={'选择乘客'} rightText={lan.confirm} onLeftClick={() => Popup.hide()} onRightClick={() => {
                Popup.hide();
            }} />
            <List>
                <List.Item
                    wrap
                    extra={<View style={{ width: 100 }}>
                        <Stepper
                            // style={{ width: '100%', minWidth: '100px' }}
                            showNumber
                            max={10}
                            min={1}
                            readOnly={false} defaultValue={1}
                            value={this.state.adultVal}
                            step={1}
                            onChange={this.onChangeAdult}
                        /></View>}
                >
                    成人（12岁以上）
                </List.Item>
                <List.Item
                    wrap
                    extra={<View style={{ width: 100 }}>
                        <Stepper
                            showNumber
                            max={10}
                            min={1}
                            readOnly={false} defaultValue={0}
                            value={this.state.childrenVal}
                            step={1}
                            onChange={this.onChangeChildren}
                        /></View>}
                >
                    儿童（2-11岁）
                </List.Item>
                <List.Item
                >
                    <Text style={{ color: '#999' }}>注：无成人陪伴儿童或两岁以下婴儿请致电4000-678-6622人工预订！</Text>
                </List.Item>
            </List>
        </View>
    }

}




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.containerBg,
    },


    //机票
    scrollView: {
        padding: 5,
        paddingTop: 10
    },
    box: {
        backgroundColor: '#fff'
    },
    cityView: {
        flex: 1,
        paddingTop: 40,
        paddingBottom: 25,
        marginBottom: 10,

    },
    cityView_left: {
        flex: 0.35,
        // backgroundColor:'red'


    },
    cityView_right: {
        flex: 0.35,


    },
    cityView_center: {

        flex: .2,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor:'red',
        marginTop: -10,



    },
    cityVal: {
        fontSize: 28,
        color: '#333',
        marginBottom: 10,
        // backgroundColor: '#fff',
        // transform: [{ translateX: 20, }]
    },
    cityVal_left: {
        textAlign: 'right',

    },
    cityTitle: {
        fontSize: 12,
        color: '#999',
        // transform: [{ translateX: 20, }]
    },
    legTitle: {
        marginBottom: 5,
        fontSize: 12,
        color: COLORS.secondary
    },
    delIcon: {
        fontSize: 15,
        color: '#999'
    },
    cityIcon: {
        fontSize: 12,
        color: '#999',
    },
    cityTurn: {
        fontSize: 18,
        color: '#666'
    },
    dateView: {
        padding: 10,
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 10,
    },
    dateView_title: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
    },
    dateVal: {
        fontSize: 16,
        color: '#666',

    },
    dateIcon: {
        fontSize: 14,
        color: '#666',
        marginRight: 2,
        marginTop: 2,
    },
    dateView_right: {
        flex: 1,
        borderLeftWidth: 1 / FLEXBOX.pixel,
        borderLeftColor: '#ddd',
        alignItems: 'flex-end'

    },
    dateView_left: {
        flex: 1,
    },
    staffTitle: {
        color: '#333'
    },
    staffRightText: {

        // flexDirection: 'row',
        width: FLEXBOX.width * 0.5,
        color: '#666',
        textAlign: 'right'


    },
    staffItem: {
        padding: 15,
        paddingTop: 12,
        paddingBottom: 10,

    },
    staffRightInner: {
        padding: 5,
        paddingLeft: 15,
        paddingRight: 10,
        borderLeftWidth: 1 / FLEXBOX.pixel,
        borderLeftColor: '#ddd'
    },

    iconText: {
        alignItems: 'center',
    },
    cityIconText: {
        height: 30, transform: [
            {
                translateY: -5

            }
        ],
    },
    staff: {
        flex: 1,
        //padding: 10,
        flexDirection: 'row',
        marginBottom: 10,
    },
    staffRight: {
        flex: .5,
        paddingTop: 8,
        paddingBottom: 8,
        alignItems: 'center',
        //backgroundColor: 'blue',
        flexDirection: 'row',
        justifyContent: 'flex-end',

    },
    staffLeft: {
        flex: .5
    },
    staffText: {
        flex: .6
    },
    arrowRight: {
        color: '#999',

    },
    confirmBtn: {
        backgroundColor: COLORS.secondary,
        marginBottom: 10,
        marginTop: 10
    },
    confirmBtnTxt: { color: '#fff' },
    //切换
    switch: {
        borderColor: '#fff',
        borderWidth: 1 / FLEXBOX.pixel,
        // borderRadius: 3,
        width: 70,
        height: 25,
        backgroundColor: 'transparent',
        //overflow: 'hidden'
    },
    switch_tab: {
        flex: 1,
        backgroundColor: 'transparent',
        padding: 2,
        alignItems: 'center',


    },
    switch_tabActive: {
        backgroundColor: "#fff",

    },
    switch_txt: {
        fontSize: 12,
        color: '#fff'
    },
    switch_txt_acitve: {
        color: '#333'
    },
    record_item: {
        marginTop: 15,
        marginRight: 20,
        color: '#999',
        fontSize: 13,
        textDecorationLine: 'underline'
    },
    clear_record_btn: {
        marginTop: 15,
        marginBottom: 25,
        alignSelf: 'center',
    },
    addLeg_btn: {
        height: 40,
        marginBottom: 10,
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4
    },
    addIcon: {
        fontSize: 13,
        color: COLORS.secondary,
        marginRight: 8
    },
    //tab 切换
    tabButton: {
        borderBottomWidth: 1 / FLEXBOX.pixel,
        borderBottomColor: '#ddd'
    },
    tabButtonAT: {
        color: '#333'
    },
    tabButtonT: {
        color: '#999'
    },
    tabButtonAI: {
        borderBottomColor: COLORS.secondary,
        paddingLeft: 10,
        paddingRight: 10,
    },
    tabButtonI: {
        borderBottomWidth: 3 / FLEXBOX.pixel,
        borderBottomColor: '#fff',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    //Stepper 步进器 ---乘客
    stepListItem: {
        width: 300
    },
    inp: {
        width: 60
    },
    inpText: {
        color: '#333', fontSize: 16,
        textAlign: 'center'
    },
    stepper: {
        // borderColor:'#ddd',
        // borderWidth:1,
        // borderStyle:'solid',
        // borderRadius:3,

    },
    stepWrap: {
        width: 28,
        height: 28,
        borderWidth: 1,
        borderColor: '#d9d9d9',
        borderRadius: 6,
        backgroundColor: 'white'
    },
    stepText: {
        textAlign: 'center',
        fontSize: 20,
        color: '#999',
        backgroundColor: 'transparent'
    },
    stepDisabled: {
        borderColor: '#d9d9d9',
        backgroundColor: 'rgba(239, 239, 239, 0.72)'
    },
    disabledStepTextColor: {
        color: '#ccc'
    },
    highlightStepTextColor: {
        color: '#2DB7F5'
    },
    highlightStepBorderColor: {
        borderColor: '#2DB7F5'
    }

});

export default Index