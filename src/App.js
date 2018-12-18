
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
  StatusBar,
  Navigator, BackAndroid, TouchableOpacity, Alert
} from 'react-native';
import CodePush from 'react-native-code-push';
import WelcomeOrMain from '../src/pages/login/WelcomeOrMain';
import { initData } from './components/calendar';
import { ModalBox } from './components/modalbox';

import { COLORS, FLEXBOX } from '../src/styles/commonStyle';


export default class App extends Component {

  constructor(props){
    super(props);

    this.state = {


    }


  }


  componentDidMount() {
    let _this = this;
    ModalBox.init(_this);
    initData();

    //热更新
      _this.sync();

    BackAndroid.addEventListener('hardwareBackPress', function () {
      if (_this.navigator && _this.navigator.getCurrentRoutes().length > 1) {
        _this.navigator.pop();
        return true;
      } else {
        BackAndroid.exitApp();
        return false;
      }
    });
  }

  sync = () =>{

      CodePush.sync(
          {
              installMode: CodePush.InstallMode.IMMEDIATE,
              updateDialog: {
                  optionalIgnoreButtonLabel: '稍后更新',
                  optionalInstallButtonLabel: '立即更新',
                  optionalUpdateMessage: '修复部分bug',
                  title: '新版本提示',
              }
          },
          this.codePushStatusDidChange.bind(this),
          this.codePushDownloadDidProgress.bind(this)
      );

  }


    codePushStatusDidChange(syncStatus) {


        switch (syncStatus) {
            case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
                this.setState({ syncMessage: "Checking for update." });
                break;
            case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
                this.setState({ syncMessage: "Downloading package." });
                break;
            case CodePush.SyncStatus.AWAITING_USER_ACTION:
                this.setState({ syncMessage: "Awaiting user action." });
                break;
            case CodePush.SyncStatus.INSTALLING_UPDATE:
                this.setState({ syncMessage: "Installing update." });
                break;
            case CodePush.SyncStatus.UP_TO_DATE:
                this.setState({ syncMessage: "App up to date.", progress: false });
                break;
            case CodePush.SyncStatus.UPDATE_IGNORED:
                this.setState({ syncMessage: "Update cancelled by user.", progress: false });
                break;
            case CodePush.SyncStatus.UPDATE_INSTALLED:
                this.setState({ syncMessage: "Update installed.", progress: false });
                break;
            case CodePush.SyncStatus.UNKNOWN_ERROR:
                this.setState({ syncMessage: "An unknown error occurred.", progress: false });
                break;
        }
    }

    codePushDownloadDidProgress(progress) {

        this.setState({ progress });
    }


    renderProgreessView = () => {

        if (this.state.progress) {

            return (

                <View style={styles.downLoadBG}>
                  <View style={styles.downloadMain}>
                    <Text style={styles.downloadTitle}>正在更新</Text>
                    <View style={styles.downloadInfo}>
                      <View style={[styles.downloadLeft, { width: (this.state.progress.receivedBytes / this.state.progress.totalBytes) * (window.width - 2 * (50 + 10) - 45) }]}></View>
                      <Text style={styles.downloadRight}>
                          {(parseInt(100 * this.state.progress.receivedBytes / this.state.progress.totalBytes)) > 0 ? (parseInt(100 * this.state.progress.receivedBytes / this.state.progress.totalBytes)).toString() + '%' : '1%'}
                      </Text>
                    </View>
                  </View>
                </View>

            )
        }
        return null

    }



    render() {
    //暂不要删掉下面这段代码
    var NavigationBarRouteMapper = {
      LeftButton: function (route, navigator, index, navState) {
        return null;
      },
      RightButton: function (route, navigator, index, navState) {

        return null;


      },
      Title: function (route, navigator, index, navState) {
        return null;
      },
    };
        return (
          <View style={{flex:1}}>
            <StatusBar
                    animated={true}
                    hidden={false}
                    backgroundColor={'transparent'}
                    translucent={true}
                    barStyle="light-content"
                    showHideTransition={'fade'}
                />
            <Navigator 
                    initialRoute={{ name: 'WelcomeOrMain', component: WelcomeOrMain }}
                    configureScene={(route, routeStack) => {
                      if (route.type == 'Bottom') {
                        return Navigator.SceneConfigs.FloatFromBottomAndroid // 底部弹出
                      }
                      return Navigator.SceneConfigs.PushFromRight; // 右侧弹出
                    }}
                    renderScene={(route, navigator) => {
                    let Component = route.component;
                    this.navigator = navigator;
                    return <Component {...route.passProps} navigator={navigator} />;
                    }} navigationBar={
                      <Navigator.NavigationBar
                        routeMapper={NavigationBarRouteMapper}
                        style={styles.navBar} />}
            />

              {this.renderProgreessView()}

          </View>
          
        );
  }
}

//待说明
Navigator.prototype.replaceWithAnimation = function (route) {
  const activeLength = this.state.presentedIndex + 1;
  const activeStack = this.state.routeStack.slice(0, activeLength);
  const activeAnimationConfigStack = this.state.sceneConfigStack.slice(0, activeLength);
  const nextStack = activeStack.concat([route]);
  const destIndex = nextStack.length - 1;
  const nextSceneConfig = this.props.configureScene(route, nextStack);
  const nextAnimationConfigStack = activeAnimationConfigStack.concat([nextSceneConfig]);

  const replacedStack = activeStack.slice(0, activeLength - 1).concat([route]);
  this._emitWillFocus(nextStack[destIndex]);
  this.setState({
    routeStack: nextStack,
    sceneConfigStack: nextAnimationConfigStack,
  }, () => {
    this._enableScene(destIndex);
    this._transitionTo(destIndex, nextSceneConfig.defaultTransitionVelocity, null, () => {
      this.immediatelyResetRouteStack(replacedStack);
    });
  });
};

Navigator.prototype.immediatelyResetRouteStackWithAnimation = function (actives, route) {
  const activeLength = this.state.presentedIndex + 1;
  const activeStack = this.state.routeStack.slice(0, activeLength);
  const activeAnimationConfigStack = this.state.sceneConfigStack.slice(0, activeLength);
  const nextStack = activeStack.concat([route]);
  const destIndex = nextStack.length - 1;
  const nextSceneConfig = this.props.configureScene(route, nextStack);
  const nextAnimationConfigStack = activeAnimationConfigStack.concat([nextSceneConfig]);

  const replacedStack = activeStack.slice(0, activeLength - 1).concat([route]);
  this._emitWillFocus(nextStack[destIndex]);
  this.setState({
    routeStack: nextStack,
    sceneConfigStack: nextAnimationConfigStack,
  }, () => {
    this._enableScene(destIndex);
    this._transitionTo(destIndex, nextSceneConfig.defaultTransitionVelocity, null, () => {
      this.immediatelyResetRouteStack(actives.concat([route]));
    });
  });
};







var styles = StyleSheet.create({

    navBarLeftButton: {
        paddingLeft: 15,
        paddingRight: 15,
        height: 44
    },
    navBar: {
        backgroundColor: '#f44848',
        height: 0
    }, navBarText: {
        fontSize: 16,
        color: 'white',
        justifyContent: 'center',
    },


    downLoadBG: {
        // flexDirection:'column',
        backgroundColor: 'rgba(0,0,0,0.3)',
        position: 'absolute',
        top: 0,
        left: 0,
        width: window.width,
        height: window.height,
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadMain: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        position: 'absolute',
        top: window.height * 0.35,
        width: window.width - 2 * 50,
        marginLeft: 50,
        marginRight: 50,
        borderRadius: 5,

    },
    downloadTitle: {
        fontSize: 15,
        padding: 15,
    },
    downloadInfo: {

        flexDirection: 'row',
        //alignItems:'center',
        justifyContent: 'center',
        // backgroundColor:'yellow',
        width: window.width - 2 * 50,
        height: 40,
        padding: 5,
    },
    downloadLeft: {
        left: 15,
        position: 'absolute',
        top: 15,
        width: 150,
        height: 5,
        backgroundColor: '#f44848',

    },
    downloadRight: {
        fontSize: 16,
        position: 'absolute',
        top: 10,
        right: 15,

    },





    searchExtra: {

        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        backgroundColor: 'rgb(255,255,255)',
        paddingLeft: 0,
        paddingTop: 10,
        paddingBottom: 20,
        alignItems: 'center',
        //borderTopColor: '#ddd',
        // borderTopWidth: 1 / FLEXBOX.pixel,
        // height: 220,

    },

    topActionTitle: {

        fontSize: 15,
        color: 'rgb(102,102,102)',
        marginTop: 5

    },
    topActionCount: {

        fontSize: 20,
        color: '#000003'

    },


    actionItem: {

        alignItems: 'center',
        justifyContent: "center",
        width: window.width / 4,
        marginBottom: 10,
    },

    actionIcon: {

        fontFamily: 'iconfontim',
        fontSize: 20,
        color: '#fff'

    },
    actionText: {
        fontSize: 15,
        color: 'rgb(51,51,51)',
        marginTop: 10
    },

    iconBox: {
        borderRadius: 10,
        borderColor: '#dededf',
        borderWidth: 1 / FLEXBOX.pixel,
        backgroundColor: '#fbfbfc',
        width: 60,
        height: 60,
        justifyContent: "center",
        alignItems: 'center',
        marginBottom: 5,

    },

    tipActionItem: {

        alignItems: 'center',
        justifyContent: "center",
        width: window.width / 3,
        marginBottom: 0,

    },





    page: {
        flex: 1,
        // alignItems: 'center',
        // justifyContent: 'center',

    },
    indexList: {
        height: window.height - 200,
    },

    login: {

    },
    loginBG: {
        width: window.width,
        height: window.height,

        flexDirection: 'column',
        // justifyContent:'center',
        alignItems: 'center',
    },
    logo: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        // position:'absolute',
        top: 40,
        left: 0,
        right: 0,
        marginBottom: 40,
    },
    logoImg: {
        width: 60,
        height: 60,
    },
    logoName: {
        padding: 10,
        color: 'white',
        fontSize: 15,
        textAlign: 'center',
    },


    loginMain: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        //backgroundColor:'red',
    },


    loginItem: {
        // marginLeft:50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        padding: 10,
        // flex:1,
        // borderWidth:1,
        // borderColor:'yellow',

    },
    loginItemLeft: {

        fontFamily: 'iconfont',
        fontSize: 20,
        paddingRight: 20,
        color: 'white',
        // flex:1,
        //height:30,
    },
    loginItemRight: {
        width: window.width - 40 * 3,
        height: 30,
        color: 'white',
    },


    remember: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 8,
        paddingRight: 0,
        paddingLeft: 230,
    },
    remberIcon: {
        fontFamily: 'iconfont',
        fontSize: 15,
        // color:'white',
        backgroundColor: 'white',
        width: 20,
        height: 20,
        textAlign: 'center',
        //padding:1,
    },
    remmeberInfo: {
        color: 'white',
        padding: 5,
    },
    loginButton: {
        backgroundColor: 'rgb(21,158,125)',
        color: 'white',
        padding: 12,
        width: window.width - 20 * 2,
        textAlign: 'center',
        fontSize: 18,
        margin: 10,
    },


    index: {
        //flex:1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indexTop: {

        width: window.width,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgb(21,158,125)',
        paddingTop: 20,
    },

    indexTopImg: {
        width: 30,
        height: 30,
        borderRadius: 15,
        overflow: 'hidden',
        margin: 5,

    },
    indexTopName: {
        color: 'white',
        paddingLeft: 10,
        padding: 5,
        fontSize: 15,
    },
    indexTopAccount: {
        color: 'white',
        fontSize: 10,
    },
    indexTopMessage: {
        fontFamily: 'iconfont',
        color: 'white',
        fontSize: 24,
        paddingLeft: 10,
        // position:'absolute',
        // right:20,
        // top:25,

    },


    messageNumber: {
        backgroundColor: 'red',
        color: 'white',
        overflow: 'hidden',
        width: 18,
        height: 18,
        fontSize: 13,
        borderRadius: 9,
        // position:'absolute',
        // right:10,
        top: -8,
        right: 5,
        textAlign: 'center',
    },

    indexTopSwitch: {
        fontFamily: 'iconfont',
    },


    indexMainListStyle: {
        //height:Common.window.height-64-65,
    },

    indexMainList: {

        justifyContent: 'space-around',
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',

    },
    indexMainItem: {
        // backgroundColor:'red',
        paddingTop: 20,
        //justifyContent:'center',//垂直
        alignItems: 'center',
        borderWidth: 1,
        //borderRadius:5,
        borderColor: '#FAFAFA',
        width: window.width / 3,
        // marginBottom:10,
        //marginTop:10,
        height: window.width / 3,


    },

    indexMainItemIcon: {
        fontFamily: 'iconfont',
        fontSize: 32,
    },
    indexMainItemNumber: {

        padding: 2,

    },
    indexMainItemTitle: {
        fontSize: 12,
        padding: 10,
        paddingTop: 0,
    },




    searchBarBG: {

        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eee',
        padding: 10,
        //backgroundColor:'red',
        //borderRadius:20,
        //overflow:'hidden',


    },
    searchBarLeft: {
        flex: 1,
        height: 32,
        paddingTop: 9,
        fontFamily: 'iconfont',
        fontSize: 12,
        backgroundColor: 'white',
        textAlign: 'center',
        overflow: 'hidden',
        color: '#ccc',
        //borderRadius:5,
    },
    searchBarInput: {
        flex: 15,
        backgroundColor: 'white',
        height: 32,
        marginRight: 10,
        fontSize: 15,
        //borderRadius:5,
        // width:100,
    },
    searchBarCancel: {
        flex: 1,
        // color:'#f44848',
        color: 'white',
        marginLeft: 10,
        fontSize: 15,
    },


    historyListStyle: {
        backgroundColor: 'white',
        position: 'absolute',
        top: 110,
        left: 0,
        right: 0,
    },


    historyCellItem: {

        justifyContent: 'center',//垂直
        //alignItems:'center',
        width: window.width,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        //backgroundColor:'blue',




    },

    historyCellInfo: {
        backgroundColor: 'blue',
        color: '#333',
        textAlign: 'center',
        padding: 8,
        paddingLeft: 18,
        paddingRight: 18,
        margin: 5,
        //borderRadius:5,
        fontSize: 14,
        overflow: 'hidden',
        //flex:1,
        textAlign: 'left'



    },

    loadingMore: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        width: 140,
        marginTop: window.height / 2 - 60,
        height: 120,


        marginLeft: (window.width - 140) / 2,
        marginRight: (window.width - 140) / 2,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,

    },
    loading: {
        margin: 20,

    },
    loadingMoreTitle: {

        marginLeft: 10,
        fontSize: 18,
        color: 'white',
    },

    bottom: {
        backgroundColor: 'white',
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: window.width,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    bottomItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',




    },
    bottomItemIcon: {
        fontFamily: 'iconfont',
        // fontSize:55,
        fontSize: 28,
        color: '#555',
    },
    bottomItemInfo: {
        fontSize: 11,
        color: '#666',

    },
    bottomItemCenter: {
        marginLeft: 1,
        fontFamily: 'iconfont',
        fontSize: 24,
        color: 'white',
        borderRadius: 24,
        overflow: 'hidden',
        textAlign: 'center',
        backgroundColor: 'transparent',
        width: 48,
        height: 48,
        lineHeight: 48,
    },
    CameraBG: {
        width: 50,
        height: 50,
    },

    quotePricesCell: {
        width: window.width,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 5,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
    },
    quotePricesCellLeft: {
        //flex:1,
        fontFamily: 'iconfont',
        fontSize: 20,
        padding: 5,
        marginLeft: 10,

        //backgroundColor:'orange',
        borderRadius: 15,
        width: 30,
        height: 30,
        overflow: 'hidden',
        textAlign: 'center',
        color: 'white',
    },


    quotePricesCellLeftImg: {
        width: 40,
        height: 40,
    },


    quotePricesCellCenter: {
        flex: 8,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 5,
        paddingLeft: 4,

    },
    quotePricesCellCenterInfo: {

        textAlign: 'left',
        // backgroundColor:'red',
    },
    quotePricesCellCenterDetail: {

        textAlign: 'left',
        padding: 5,
        paddingLeft: 0,
    },
    quotePricesCellRight: {
        flex: 2,
        textAlign: 'right',
        //margin:1
        right: 10,

    },

    switch: {
        position: 'absolute',
        right: 5,
        bottom: 5,
        // width:50,
        // height:30,
    },



    receiveInfo: {
        fontSize: 15,
        position: 'absolute',
        right: 60,
        color: 'white',
        // top:10,
        textAlign: 'center',
        bottom: 12,

    }




})

