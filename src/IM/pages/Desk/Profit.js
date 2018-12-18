/**
 * Created by yqf on 2018/8/22.
 */



//团队毛利


import {observer} from 'mobx-react/native';
import {observable, autorun, computed, extendObservable, action, toJS} from 'mobx'
import {Component} from 'react';
import React, {PropTypes} from 'react';
import Icon from '../../components/icon';

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



const window = {

    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,

}

let canLoadVideoMore = false;


class ProfitModel extends Component {


    @observable isLoading = true;
    @observable loadingText = "正在加载数据..."

    @observable PageSize = 4;//数目
    @observable PageCount = 1;//页码
    @observable isVideoRefreshing = false;//是否刷新
    @observable RowCount = 0;
    @observable UserPosterList = [];

    @observable selectIndex = 0;

    @computed get getTitleDataSource() {

        ds1 = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        return ds1.cloneWithRows(Chat.obj.PriceAnalysis.slice());
    }

    @computed get getDataSource() {

        ds2 = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        return ds2.cloneWithRows(Chat.obj.PriceAnalysis.slice());

    }


}

@observer
export  default class Profit extends Component {

    constructor(props) {
        super(props);
        this.store = new ProfitModel();
    }


    componentDidMount = () => {

            if(Chat.obj.PriceAnalysis){
                this.store.isLoading = false;
              //  console.dir(Chat.obj.PriceAnalysis)

            }else {
                this.store.isLoading = false;
                this.store.isEmpty = true;
            }

    }



    _ClickTitleItem = (data, rowId) => {

        this.store.isLoading = true;

        var temp = this.store.PriceAnalysis;

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

                alert(data.StaffName)
            }}>

                <View style={{padding:10,backgroundColor:"white",alignItems:"center"}}>

                    <Text>{data.StaffName}</Text>

                </View>


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


        var imageW = 50;
        var uri = "http://3g.yiqifei.com/userimg/"+data.UserCode+"!80"
        var Lev;
        var Maoli = "毛利 "+data.TotalAmount;


        if(data.Lev==0){
            Lev = "本人"
        }else if(data.Lev==1){
            Lev = "下级"

        }else if(data.Lev==2){
            Lev = "下下级"

        }else if(data.Lev==-1){
            Lev = "上级"

        }else if(data.Lev==-2){
            Lev = "上商机"

        }


        return(

            <View style={{flexDirection:"row",alignItems:'center'}}>

                <Image style={{width:imageW,height:imageW,borderRadius:imageW/2, margin:10,resizeMode: 'stretch'}} source={{uri:uri}}></Image>

                <View>

                    <View style={{flexDirection:'row',alignItems:'center'}}>

                    <Text style={{color:'rgb(51,51,51)',fontSize:16}}>{data.StaffName}</Text>
                    <Text style={{color:'rgb(244,72,72)',fontSize:17,marginLeft:10}}>{Lev}</Text>

                    </View>

                    <Text style={{color:'rgb(153,153,153)',fontSize:13,marginTop:10}}>{Maoli}</Text>


                </View>




            </View>

        )


        /*
        return (
            <TouchableOpacity
                onPress={() => {

                  //
                    alert("点击了..."+data.StaffName)

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
*/

    }


    _renderLine() {


        return (
            <View style={{backgroundColor: 'rgb(235,235,235)', height: 1, marginLeft: 10}}></View>
        )
    }

    _renderNav() {
        return (
            <YQFNavBar title={'我的上级下线'}
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

            <View style={{height: 80, backgroundColor: 'green'}}>

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


            return (
                <ListView

                    scrollEnabled={true}
                    renderSeparator={()=>{
                        return(
                            <View style={{height:5,backgroundColor:'rgb(220,220,220)'}}>
                            </View>
                        )
                    }}
                    renderHeader={()=>{
                        return(
                            <View style={{margin:10}}>
                                <Text>{'我的团队 '+Chat.obj.PriceAnalysis.length}</Text>
                                <View style={{height:5,backgroundColor:'rgb(220,220,220)'}}>
                                </View>
                            </View>
                        )
                    }}
                    dataSource={this.store.getDataSource}
                    renderRow={this._renderRowPosterItem}

                >
                </ListView>
            )




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
