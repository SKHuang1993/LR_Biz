/**
 * Created by yqf on 2018/5/8.
 */
/**
 * Created by yqf on 2017/12/1.
 */

//海报列表


import {observer} from 'mobx-react/native';
import {observable, autorun, computed, extendObservable, action, toJS} from 'mobx'
import {Component} from 'react';
import React, {PropTypes} from 'react';
import CountDownTimer from 'react_native_countdowntimer'
import Icon from '../../components/icon';
import moment from 'moment';

import {
    View,
    Text,
    Image,
    StyleSheet,
    ListView,
    ScrollView,
    TouchableWithoutFeedback,
    InteractionManager,
    StatusBar,
    WebView,
    AsyncStorage,
    TouchableOpacity,
    Modal,
    DeviceEventEmitter,
    Switch,
    Platform,
    Dimensions,
    RefreshControl,
    Alert


} from  'react-native';


import YQFNavBar from '../../components/yqfNavBar';
import Colors from '../../Themes/Colors';


import {Chat} from '../../utils/chat';
import {RestAPI, ServingClient} from '../../utils/yqfws';
import ActivityIndicator from '../../components/activity-indicator/index'
import PosterDetail from './PosterDetail'

import LoadMoreFooter from '../../components/LoadMoreFooter';


const window = {

    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,

}

let canLoadVideoMore = false;


class PosterListModel1 extends Component {

    @observable isLoading = true;
    @observable loadingText = "正在加载数据..."

    @observable PageSize = 4;//数目
    @observable PageCount = 1;//页码
    @observable isVideoRefreshing = false;//是否刷新
    @observable RowCount = 0;
    @observable UserPosterList = [];

    @observable selectIndex = 0;

    @observable titleArray = [
        {name: '航旅早报', select: true},
        {name: '航旅晚报', select: false},
        {name: '宣传海报', select: false},
        {name: '团票宝', select: false},
        {name: '航旅午报', select: false},

    ];


    @computed get getTitleDataSource() {

        ds1 = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        return ds1.cloneWithRows(this.titleArray.slice());
    }

    @computed get getDataSource() {

        ds2 = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        return ds2.cloneWithRows(this.UserPosterList.slice());

    }


}

@observer
export  default class PosterList1 extends Component {

    constructor(props) {
        super(props);
        this.store = new PosterListModel1();
    }


    componentDidMount = () => {

        this.onRefresh();
    }

    onScroll() {
        if (!canLoadVideoMore) canLoadVideoMore = true;
    }

    onRefresh = async() => {

        this.store.PageCount = 1;//刷新时将页码设置为1
        canLoadVideoMore = false;
        this.store.isVideoRefreshing = true;
        this._fetchData();

    }

    onEndReach = async() => {

        if (this.store.UserPosterList.length == 0 || (this.store.RowCount > 0 && this.store.RowCount <= this.store.UserPosterList.length)) {
            return;
        }


        if (canLoadVideoMore) {

            var count = this.store.PageCount;
            this.store.PageCount = count + 1;

            this._fetchData();
        }


    }
    renderFooter = () => {


        if (this.store.UserPosterList.length == 0 || (this.store.RowCount > 0 && this.store.RowCount <= this.store.UserPosterList.length)) {

            return (

                <View style={{justifyContent: 'center', alignItems: 'center', margin: 10}}>

                    <Text>没有更多了...</Text>

                </View>
            )
        }

        if (canLoadVideoMore) {

            return <LoadMoreFooter/>
        }
    }


    // 批量生成用户海报
    _UserPosterBatchCreate = async(param) => {

        var result = await ServingClient.execute('Channel.UserPosterBatchCreate', param);
        return result;


    }


    _fetchData = async() => {


        if (this.store.PageCount == 1)
            this.store.UserPosterList = [];

        var PosterCategoryID = 0;

        if (this.store.selectIndex == 0) {

            PosterCategoryID = 2;//早报

        } else if (this.store.selectIndex == 1) {
          //  PosterCategoryID = 1;//午报
            PosterCategoryID = 3;//宣传海报

        } else if (this.store.selectIndex == 2) {

           // PosterCategoryID = 3;//宣传海报

            PosterCategoryID = 4;//宣传海报


        } else if (this.store.selectIndex == 3) {

           // PosterCategoryID = 4;//宣传海报
            PosterCategoryID = 6;//团票宝

        } else if (this.store.selectIndex == 4) {
          // PosterCategoryID = 6;//团票宝
          // PosterCategoryID = 4;//宣传海报

            PosterCategoryID = 1;//午报

        }


        this.store.loading = true;

        var param = {
            UserCode: Chat.loginUserResult.AccountNo,
            PosterCategoryID: PosterCategoryID,
            PageSize: this.store.PageSize,
            PageCount: this.store.PageCount,
        };


        // console.log('现在的请求参数')
        // console.dir(param);


        var result = await  ServingClient.execute('Channel.UserPosterListByUserCode', param);


        //加载完马上将刷新关掉
        this.store.isVideoRefreshing = false;

        if (result && result.UserPosterList && result.UserPosterList.length > 0) {


            // console.log('现在的请求结果')
            // console.dir(result);

            this.store.RowCount = result.RowCount;
            this.store.isEmpty = false;


            var UserPosterBatchs = []
            for (var i = 0; i < result.UserPosterList.length; i++) {
                //如果没有生成。而且又在时间范围内的，则可以拼接
                var UserPoster = result.UserPosterList[i]
                var nowDate = this._getCurrentTime();//当前的时间
                var StartDate = UserPoster.StartDate;
                var EndDate = UserPoster.EndDate;

                //还没有生成的...而且海报的时效性还在..如果当前的时间处于海报生效开始时间和海报生效结束时间之间
                if (UserPoster.IsShare == null && EndDate > nowDate) {
                    //如果海报没有生成，同时时间又可以

                    var map = {}
                    map.UserCode = Chat.loginUserResult.AccountNo;//生成人账号
                    map.StaffCode = Chat.loginUserResult.DetailInfo.Person;
                    map.PosterID = UserPoster.ID;
                    UserPosterBatchs.push(map)


                }

            }


            var temp = result.UserPosterList;


            if (UserPosterBatchs && UserPosterBatchs.length >= 1) {


                this.store.loadingText = "最新海报正在生成中";


                var UserPosterBatchCreateParam = {UserPosters: UserPosterBatchs}

                let UserPosterBatchCreateResult = await this._UserPosterBatchCreate(UserPosterBatchCreateParam)

                // console.log('UserPosterBatchCreateResult ----批量生成海报的结果')
                // console.dir(UserPosterBatchCreateResult)

                if (UserPosterBatchCreateResult) {

                    //如果有返回值证明已经生成成功了。这时候需要修改这个数组的内容，修改其data.IsShare==true 证明是生成了...
                    for (var i = 0; i < UserPosterBatchs.length; i++) {

                        var UserPosterBatch = UserPosterBatchs[i];

                        for (var j = 0; j < temp.length; j++) {

                            if (UserPosterBatch.PosterID == temp[j].ID) {

                                temp[j].IsShare = false;
                                //将当前的时间写进去
                                temp[j].UserPosterCreateDate = moment().format();


                                break;
                            }

                        }


                    }


                } else {
                    //没有返回值就证明失败了...

                }

            } else {

                //  console.log("找不到可以生成的海报。这时候参数不变，依然传到下面的数组去")


            }


            // console.log("处理后的temp海报生成")
            // console.dir(temp);


            //刷新
            if (this.store.PageCount == 1) {


                this.store.UserPosterList = temp.slice();


            } else {  //如果是加载更多的话，则将新视频，拼接到原来的旧数组上面去

                //关闭加载更多

                canLoadVideoMore = false;
                this.store.UserPosterList = this.store.UserPosterList.concat(temp).slice();

            }


            //数据全部加载完再将loading去掉
            this.store.isLoading = false;


        }

        else {

            //

            this.store.isLoading = false;
            this.store.isEmpty = true;
        }


    }


    _ClickTitleItem = (data, rowId) => {

        this.store.isLoading = true;

        var temp = this.store.titleArray;

        for (var i = 0; i < temp.length; i++) {
            temp[i].select = false;
        }
        temp[rowId].select = true;

        this.store.selectIndex = rowId;
        this.store.PageCount = 1;//页码变为1
        this.store.titleArray = temp.slice();

        this._fetchData();


    }


    _renderTitleItem = (data, sectionId, rowId) => {

        var titleColorStyle;
        if (data.select == true) {
            titleColorStyle = {
                color: Colors.colors.LR_Color,
                fontSize: 16
            }
        } else {
            titleColorStyle = {
                color: Colors.colors.Chat_Color51,
                fontSize: 15
            }
        }

        return (


            <TouchableOpacity style={{}} onPress={() => {
                this._ClickTitleItem(data, rowId)
            }}>
                <Text style={[{margin: 10,}, titleColorStyle]}>{data.name}</Text>
                {
                    data.select == true ?

                        <View style={{
                            backgroundColor: Colors.colors.LR_Color,
                            height: 2,
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0
                        }}></View>

                        :
                        null

                }

            </TouchableOpacity>

        )

    }


    _ToPosterDetail = async(data, context) => {



        // console.log('跳到海报详情，判断是生成还是查看，如果生成的话，则需要发请求，如果是分享，则直接查看.')
        // console.dir(Chat.loginUserResult);

        //没有生成过，发请求生成
        if (data.IsShare == null) {
            var UserPosterAddParam = {

                UserCode: Chat.loginUserResult.AccountNo,//生成人账号
                StaffCode: Chat.loginUserResult.DetailInfo.Person,
                PosterID: data.ID,//
            };

            var result = await  ServingClient.execute('Channel.UserPosterAdd', UserPosterAddParam);

            //  console.log('生成用户海报的result')
            // console.dir(result);
        }


        this.props.navigator.push({

            component: PosterDetail,
            passProps: {
                UserPosterList: data,
                IsShow: context == "海报已生成" ? true : false
            }

        })
    }

    _getCurrentTime = () => {

        var date = new Date().toISOString();
        return moment(date).format('YYYY-MM-DDTHH:mm:ss');
    }


    //显示备注
    _ShowRemark = (data) => {


        //var Remark = data.Remark ?  data.Remark : '备注';
        var content = '暂无相关内容';
        if (data.Remark) {
            content = data.Remark
        }

        Alert.alert(content)

    }

    //显示摘要
    _ShowSummary = (data) => {


        var content = '暂无相关内容';
        if (data.Summary) {
            content = data.Summary
        }

        Alert.alert(content)

    }


    _renderRow = (data, sectionID, rowID) => {

        var margin = 10;
        var scale = 113 / 142;
        var ImageHeight = 140;
        var ImageWidth = ImageHeight * scale;
        var w = parseInt(ImageWidth) * 2;
        var h = parseInt(ImageHeight) * 2;
        var scale = '!/fwfh/' + w + 'x' + h;

        var subTitleMaxLength = window.width - ImageWidth - margin * 4;
        var Remark = '备注';

        var url = Chat.getPosterImagePath(data.ImagePath) + scale;

        var isShowCount = false;

        var nowDate = this._getCurrentTime();//当前的时间
        var StartDate = data.StartDate;

        if (data.IsShare == null && StartDate > nowDate) {

            isShowCount = true;
        }

        var IsShareText = '';
        if (data.IsShare != null) {
            if (data.IsShare == true) {
                IsShareText = '已分享'
            } else {
                IsShareText = '未分享'
            }
        }

        //第一步是判断有没有分享过，如果分享过，则直接显示
        //首先需要判断时间，如果截止时间>当前时间，则代表可以生产，则显示倒计时，需要时刻显示倒计时


        return (

            <View>

                <View style={{backgroundColor: 'rgb(255,255,255)', flexDirection: 'row', margin: 0}}>

                    <Image style={{
                        margin: 10,
                        width: ImageWidth,
                        height: ImageHeight,
                        resizeMode: 'stretch',
                        borderRadius: 3,
                        overflow: 'hidden',
                    }}
                           source={{uri: url}}>

                    </Image>

                    <View style={{margin: 10, marginLeft: 0}}>

                        <Text numberOfLines={1} style={{fontSize: 17, color: 'rgb(51,51,51)'}}>{data.Title}</Text>
                        <Text numberOfLines={2} style={{
                            maxWidth: subTitleMaxLength,
                            fontSize: 15,
                            color: 'rgb(102,102,102)',
                            margin: 10,
                            marginLeft: 0
                        }}>{data.Summary}</Text>
                        <View style={{position: 'absolute', bottom: 10, right: 10, left: 0, flexDirection: 'row'}}>

                            {
                                isShowCount ?
                                    <View>
                                        <View style={{flexDirection: 'row', margin: 0, marginBottom: 5}}>

                                            <CountDownTimer
                                                date={data.StartDate}
                                                days={{plural: '', singular: ' '}}
                                                hours='时'
                                                mins='分'
                                                segs='秒'

                                                daysStyle={styles.time}
                                                hoursStyle={styles.time}
                                                minsStyle={styles.time}
                                                secsStyle={styles.time}
                                                firstColonStyle={styles.colon}
                                                secondColonStyle={styles.colon}
                                            />
                                            <Text style={styles.colon}>后停止生成</Text>
                                        </View>

                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>

                                            <Text onPress={() => {
                                                this._ToPosterDetail(data)
                                            }} style={{
                                                width: 60,
                                                padding: 10,
                                                paddingTop: 5,
                                                paddingBottom: 5,
                                                color: 'rgb(255,255,255)',
                                                backgroundColor: 'rgb(244,155,44)',
                                                fontSize: 17,
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                            }}>{'生成'}</Text>
                                            <Text onPress={() => {
                                                this._ShowRemark(data)
                                            }} numberOfLines={1} style={{
                                                color: 'rgb(252,13,28)',
                                                fontSize: 14,
                                                marginLeft: 10
                                            }}>{Remark}</Text>

                                        </View>
                                    </View>

                                    :

                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>

                                        <Text onPress={() => {
                                            this._ToPosterDetail(data)
                                        }} numberOfLines={1} style={{
                                            padding: 10,
                                            paddingTop: 5,
                                            paddingBottom: 5,
                                            color: 'rgb(244,155,44)',
                                            borderColor: 'rgb(244,155,44)',
                                            fontSize: 17,
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            borderWidth: 1,
                                            backgroundColor: 'white'
                                        }}>
                                            {'查看'}
                                        </Text>
                                        <Text onPress={() => {
                                            this._ShowRemark(data)
                                        }} numberOfLines={1} style={{
                                            color: 'rgb(252,13,28)',
                                            fontSize: 14,
                                            marginLeft: 10
                                        }}>{Remark}</Text>
                                        <Text numberOfLines={1} style={{
                                            color: 'rgb(252,13,28)',
                                            fontSize: 12,
                                            marginLeft: 25
                                        }}>{IsShareText}</Text>

                                    </View>

                            }

                        </View>


                    </View>


                </View>
                {this._renderLine()}
            </View>

        )

    }


    //渲染新海报item
    _renderRowPosterItem = (data, sectionID, rowID) => {


        var nowDate = this._getCurrentTime();//当前的时间
        var StartDate = data.StartDate;
        var context;
        var contextColor;


        if (data.IsShare == null) {
            if (StartDate > nowDate) {
                context = "海报可生成";
                contextColor = '#333';

            } else {
                context = "海报已过期，无法生成";
                contextColor = '#333';

            }

        } else {
            context = '海报已生成'
            contextColor = '#FF9800';
            // contextColor='#333';


        }


        const item = data;
        var margin = 10;
        var ImageW = (window.width - 50) / 2;
        var ImageH = ImageW * (276 / 169);
        var w = parseInt(ImageW);
        var h = parseInt(ImageH);
        var scale = '!/fwfh/' + w + 'x' + h;
        var uri = Chat.getPosterImagePath(item.ImagePath) + scale;

        var UserPosterCreateDate;
        if (data.UserPosterCreateDate) {

            UserPosterCreateDate = Chat.showDate(data.UserPosterCreateDate)
        } else {
            UserPosterCreateDate = ""
        }


        return (
            <TouchableOpacity
                onPress={() => {

                    this._ToPosterDetail(data, context)


                }}
                style={{margin: 5, borderWidth: 1, borderColor: '#999', height: ImageH + 130, backgroundColor: '#fff'}}>

                <Image style={{margin: 5, width: ImageW, height: ImageH, borderRadius: 5}} source={{uri: uri}}>

                </Image>

                <View>

                    <Text numberOfLines={1}
                          style={{maxWidth: ImageW, margin: 5, color: '#333', fontSize: 14}}>{data.Title}</Text>
                    <Text style={{margin: 5, color: contextColor, fontSize: 14}}>{context}</Text>


                    {data.IsShare !== null ?

                        <View style={{flexDirection: 'row', alignItems: 'center', margin: 5}}>

                            <Icon style={{margin: 2}} icon={'0xe170'} size={18} color={'#333'}/>
                            <Text style={{color: '#333', fontSize: 14, margin: 2}}>{UserPosterCreateDate}</Text>
                        </View>

                        :
                        <View style={{flexDirection: 'row', alignItems: 'center', margin: 5}}>

                            <Icon style={{margin: 2}} icon={'0xe170'} size={18} color={'#fff'}/>
                            <Text style={{color: 'rgb(102,102,102)', fontSize: 14, margin: 2}}>{""}</Text>
                        </View>
                    }


                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 5,
                        marginBottom: 10
                    }}>

                        <Text onPress={() => {
                            this._ShowSummary(data)
                        }} style={{padding: 5, fontSize: 12, color: 'rgb(244,72,72)'}}>{'摘要'}</Text>
                        <Text onPress={() => {
                            this._ShowRemark(data)
                        }} style={{padding: 5, fontSize: 12, color: 'rgb(244,72,72)'}}>{'备注'}</Text>

                    </View>


                </View>


            </TouchableOpacity>
        )


    }


    _renderLine() {


        return (
            <View style={{backgroundColor: 'rgb(235,235,235)', height: 1, marginLeft: 10}}></View>
        )
    }

    _renderNav() {
        return (
            <YQFNavBar title={'我的海报'}
                       leftIcon={'0xe183'}
                       onLeftClick={() => {
                           this.props.navigator.pop()
                       }}/>

        )
    }


    _renderTitleItem = (data, sectionId, rowId) => {

        var titleColorStyle;
        if (data.select == true) {
            titleColorStyle = {
                color: Colors.colors.LR_Color,
                fontSize: 16
            }
        } else {
            titleColorStyle = {
                color: Colors.colors.Chat_Color51,
                fontSize: 15
            }
        }

        return (


            <TouchableOpacity style={{width: window.width / 4, alignItems: 'center', justifyContent: 'center'}}
                              onPress={() => {
                                  this._ClickTitleItem(data, rowId)
                              }}>
                <Text style={[{margin: 10,}, titleColorStyle]}>{data.name}</Text>
                {
                    data.select == true ?

                        <View style={{
                            backgroundColor: Colors.colors.LR_Color,
                            height: 2,
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0
                        }}></View>

                        :
                        null

                }

            </TouchableOpacity>

        )

    }

    renderTitleView = () => {

        var contentViewStyle = {
            flexDirection: 'row',
        }

        return (

            <View style={{height: 40, backgroundColor: 'white'}}>

                <ListView

                    ref={(titleListview) => {
                        this.titleListview = titleListview
                    }}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    renderRow={this._renderTitleItem}
                    removeClippedSubviews={false}
                    initialListSize={10}
                    dataSource={this.store.getTitleDataSource}
                    contentContainerStyle={contentViewStyle}>

                </ListView>

            </View>
        )
    }


    _renderListView() {

        if (this.store.UserPosterList && this.store.UserPosterList.length > 0) {

            return (
                <ListView

                    contentContainerStyle={{flexDirection: 'row', flexWrap: 'wrap'}}

                    style={{marginTop: 5}}
                    scrollEnabled={true}
                    dataSource={this.store.getDataSource}
                    renderRow={this._renderRowPosterItem}
                    renderFooter={this.renderFooter}
                    onScroll={this.onScroll()}
                    onEndReached={this.onEndReach.bind(this)}
                    onEndReachedThreshold={20}
                    refreshControl={<RefreshControl refreshing={this.store.isVideoRefreshing}
                                                    onRefresh={this.onRefresh.bind(this)}
                                                    title="正在加载中..."
                                                    color="#ccc"
                    />}


                >
                </ListView>
            )
        }

        return null


    }


    renderLoading() {

        if (this.store.isLoading) {

            return <ActivityIndicator toast text={this.store.loadingText} animating={this.store.isLoading}/>

        }

        return null;

    }

    render() {

        return (

            <View style={{backgroundColor: '#fff', flex: 1}}>

                {this._renderNav()}
                {this.renderTitleView()}
                {this._renderListView()}
                {this.renderLoading()}


            </View>

        );

    }
}


const styles = StyleSheet.create({

    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    time: {

        color: 'white',
        padding: 3,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'rgb(102,102,102)',

    },


    colon: {

        color: 'rgb(153,153,153)',
        padding: 3


    },

})
