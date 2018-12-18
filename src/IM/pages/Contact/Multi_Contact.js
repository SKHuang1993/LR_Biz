/**
 * Created by yqf on 2018/7/31.
 */
//联系人多选
//#TODO 7.31




import { extendObservable, action, computed, toJS, observable, autorun, runInAction } from 'mobx';
import { observer } from 'mobx-react/native';
import React, { Component } from 'react';
import RCTDeviceEventEmitter from 'RCTDeviceEventEmitter'
import { ServingClient, RestAPI } from '../../utils/yqfws'
import {

    StyleSheet,
    ScrollView,
    View,
    Image,
    Text,
    ListView,
    TouchableOpacity,
    TextInput,
    DeviceEventEmitter

} from 'react-native';

import YQFNavBar from '../../components/yqfNavBar';
import Icon from '../../components/icon';

import Colors from '../../Themes/Colors';
import { Chat } from '../../utils/chat'


import ActivityIndicator from '../../components/activity-indicator/index'


class Multi_ContactModel extends Component {


    @observable loadingText = "";//显示加载的文本
    @observable isLoading = false;//是否加载
    @observable keyWord = null;//搜索的关键字
    @observable CurrentContacts = [];//通讯录数据（）

    @observable List = [];
    @observable selectUserArray=[];//选中的联系人
    constructor() {

        super()

        autorun(() => {

            this.List = toJS(this.CurrentContacts);
            this.selectUserArray = this.CurrentContacts.filter(item => item.isSelect == true);
        })

    }

    @computed get getDataSource() {

        const ds1 = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
        return ds1.cloneWithRows(this.List.slice());

    }
}



@observer
//联系人列表
export default class Multi_Contact extends Component {

    constructor(props) {
        super(props);



        this.store = new Multi_ContactModel()

        var tempContacts = Chat.obj.Contacts.Users;

        var tempContactsArray = []

         for (var i = 0; i < tempContacts.length; i++) {

                //将最近常用的几个人去掉
                var User = tempContacts[i].User;
                var dict = {
                    isSelect: false, // 是否选中
                    isRecently: false,//是否为最近
                    isChanged:true,//是否能修改（如果是在拉人的情况下，有些人默认选中，不能动）
                    isShow:true,//是否显示
                    User: User
                }
                tempContactsArray.push(dict);
            }
            this.store.CurrentContacts = tempContactsArray;


        if(props.type == "AddGroupMember"){

            //添加群成员 (将上一页面拿过来的数据，找得到的IMNr，对应的属性isChanged 修改为false。不可修改。暂时直接修改成，将对应的数据过滤掉)

            var oldMembersArray = props.Members
            var contacts = this.store.CurrentContacts;

            for(var i=0;i<oldMembersArray.length;i++){

                for(var j=0;j<contacts.length;j++){

                    if(oldMembersArray[i].IMNr == contacts[j].User.IMNr){
                        contacts.splice(j,1);
                        break;
                    }
                }
            }

            this.store.CurrentContacts = contacts;

        }else if(props.type == "RemoveGroupMember"){

            //移除群成员
            //清空数组，接着将传递过来的数据处理
            this.store.CurrentContacts = [];
            var tempContacts = props.Members;
            tempContactsArray = []
            for (var i = 0; i < tempContacts.length; i++) {

                //将最近常用的几个人去掉
                var User = {
                    FaceUrlPath:tempContacts[i].FaceUrlPath,
                    IMNr:tempContacts[i].IMNr,
                    Level:tempContacts[i].Level,
                    Name:tempContacts[i].Name
                }

                //如果是群主的话，则过滤掉
                if(User.Level == "Administrator" && User.IMNr ==Chat.userInfo.User.IMNr){
                    continue;
                }

                var dict = {

                    isSelect: false, // 是否选中
                    isRecently: false,//是否为最近
                    isChanged:true,//是否能修改（如果是在拉人的情况下，有些人默认选中，不能动）
                    isShow:true,//是否显示
                    User: User
                }

                tempContactsArray.push(dict)
            }

            this.store.CurrentContacts = tempContactsArray

            // console.log("RemoveGroupMember ==== 移除群成员，现在的数据")
            // console.dir( this.store.CurrentContacts)


        }else if(props.type == "CreateNewGroup"){
            //根据两个人发起新的群聊。则将


            var oldMembersArray = props.Members
            var contacts = this.store.CurrentContacts;

            for(var i=0;i<oldMembersArray.length;i++){

                for(var j=0;j<contacts.length;j++){

                    if(oldMembersArray[i].IMNr == contacts[j].User.IMNr){
                        contacts.splice(j,1);
                        break;
                    }
                }
            }
            this.store.CurrentContacts = contacts;


        }else if(props.type =='TagAdd'){


            var oldMembersArray = props.SelectArray;
            var contacts = this.store.CurrentContacts;

            for(var i=0;i<oldMembersArray.length;i++){

                for(var j=0;j<contacts.length;j++){
                    if(oldMembersArray[i].IMNr == contacts[j].User.IMNr){
                        contacts.splice(j,1);
                        break;
                    }
                }
            }

            this.store.CurrentContacts = contacts;

        } else{



        }




    }


    componentDidMount() {

        //账号被踢下线
        this.listener = RCTDeviceEventEmitter.addListener('KickOff', () => {

            this.props.navigator.popToTop();
        });

        this._HandleData();



    }


    componentWillUnmount() {
        this.listener.remove();
    }



    //搜索数据
    _SearchData = async() =>{

        //1.每次搜索的时候，先将isShow都改为

                for (j = 0; j < this.store.CurrentContacts.length; j++) {
                        //遍历通讯录；如果有和最近一样的，则修改
                        this.store.CurrentContacts[j].isShow = false;
                }


        //根据搜索框中的关键词来进行. 和现在的this.store.CurrentContacts 进行对比。哪怕是移除群成员，都可以在这里做处理
        var tempCurrentContacts =this.store.CurrentContacts;


        for(var i=0;i<tempCurrentContacts.length;i++)
        {
            var User = tempCurrentContacts[i].User;

            //将姓名进行小写转化
            var keyword_LowerCase = this.store.keyWord;
            var User_Name_LowerCase = User.Name;


            //找到的数据。这时候最好是在上面加多一个属性。如果找到了，则将其显示出来，否则就隐藏起来；
            //如果不为搜索状态，则将其显示的那个布尔值打开

            if(User.IMNr && User.IMNr.indexOf(this.store.keyWord)>-1 || User_Name_LowerCase && User_Name_LowerCase.indexOf(keyword_LowerCase)>-1)
            {

                var FindIndex = this.store.CurrentContacts.findIndex(o => o.User.IMNr == User.IMNr)
                this.store.CurrentContacts[FindIndex].isShow = true;

            }
        }




    }


    //处理数据
    _HandleData = async () => {

        if(this.props.type !== "RemoveGroupMember"){

            var GetRecentlyContactsParam = {
                Owner: Chat.userInfo.User.IMNr,
                PageNo: 0,
                PageSize: 5
            }

            let result = await ServingClient.execute("IM.GetRecentlyContacts", GetRecentlyContactsParam);

            // console.log("最近联系人数据 result");
            // console.dir(result);

            if (result.Users && result.Users.length > 0) {
                for (i = 0; i < result.Users.length; i++) {

                    for (j = 0; j < this.store.CurrentContacts.length; j++) {

                        if (result.Users[i].IMNr == this.store.CurrentContacts[j].User.IMNr) {
                            //遍历通讯录；如果有和最近一样的，则修改
                            this.store.CurrentContacts[j].isRecently = true;
                            break;

                        }

                    }
                }
            }

        }



    }


    //提交数据
    _ComfirmData =async () => {
        //在这里要来判断。
        //1。创建群聊  2。拉人  3。踢人 。由type来决定

        //创建群聊
        if(this.props.type == "CreateGroup"){

            await  this.CreateGroup();

        }else if( this.props.type == "AddGroupMember"){
            //添加群成员
           await this.AddGroupMember();

        }else if(this.props.type == "RemoveGroupMember"){
            //移除群成员
            await this.RemoveGroupMember();

        }else if(this.props.type == "CreateNewGroup"){

            //通过两个人的联系创造新群聊
            await  this.CreateNewGroup();
        }else if(this.props.type == "TagAdd"){

            //标签，往里面拉人
              this.TagAdd()

        } else if(this.props.type == "ChooseCS"){

            //转移客服
            this.ChooseCS();

        } else{

        }


    }

    //发起聊天(创建群聊)
    CreateGroup = async () => {

        //这里要考虑好是多少人，如果一个人的

        var Infos = this._getMembersAndIMNrsAndContent(this.store.selectUserArray);


        var Members = Infos.Members;
        var IMNrs = Infos.IMNrs;
        var Content = Infos.Content;

        if (Members.length == 0) {

            alert('请至少选择一个人')
            return;
        } else if (Members.length == 1) {

            var member = Members[0];
            //跳到对话窗口（这里是单聊窗口，不用插入通知）
            Chat.createConversation(this.props.navigator, member.IMNr, Content, 'C2C', (conversation) => {

            })

        } else {
            var message;
            var Name;
            //有群名
            if (this.props.Name && this.props.Name.length) {
                Name = this.props.Name;
                message = {
                    MemberNrs: IMNrs,
                    Name: Name,
                }
            }
            else {
                message = {
                    MemberNrs: IMNrs,
                }
            }
            Chat.CreateGroup(message, (response) => {

                Chat.createConversation(this.props.navigator, response.IMNr, Content, 'Group', (conversation) => {
                    var tempContent = '你邀请' + Content + '加入了群聊';
                    Chat.insertNotificationMessage(response.IMNr, "Group", tempContent);
                })

            });

        }

    }


    //添加群成员
    AddGroupMember = async () =>{

        var Members=[];
        var content='';
        var SelectList = this.store.selectUserArray;

        if(SelectList.length>0) {


            this.store.isLoading = true;
            this.store.loadingText = "正在新增成员"


            for (var i = 0; i < SelectList.length; i++) {
                Members.push(SelectList[i].User.IMNr);
                content = content+''+SelectList[i].User.Name+',';
            }

            var message = {

                GroupIMNr: this.props.GroupIMNr,
                UserIMNrs: Members,
                content:content
            };

            Chat.AddGroupMember(message,(response)=>{

                this.store.isLoading = false;

                this.props.callback('123');
                this.props.navigator.pop();

            },(failure)=>{

                this.store.isLoading = false;

                this.props.callback('123');
                this.props.navigator.pop();

            });

        } else {
            alert('请至少选择一个群成员');

        }


    }


    //移除群成员
    RemoveGroupMember = async() =>{

        var Members=[];
        var content='';

        var SelectUsersArray = this.store.selectUserArray;

        if(SelectUsersArray.length>0) {


            this.store.isLoading=true;
            this.store.loadingText = "正在移除群成员";

            for (var i = 0; i < SelectUsersArray.length; i++) {

                Members.push(SelectUsersArray[i].User.IMNr);
                content = content+''+SelectUsersArray[i].User.Name+',';
            }

            var message = {

                GroupIMNr: this.props.GroupIMNr,
                UserIMNrs: Members,
            };

            Chat.RemoveGroupMember(message, () => {

                this.store.isLoading=false;


                //将移除的成员传回去
                this.props.callback('123');
                this.props.navigator.pop();
            },() => {

                this.store.isLoading=false;


            });
        }else{
            alert('请至少选择一个群成员');
        }




    }

    //通过两个人聊天创建新的群聊
    CreateNewGroup = async() =>{

        this.store.isLoading= true;
        this.store.loadingText = "创建群聊...";


        var Infos = this._getMembersAndIMNrsAndContent(this.store.selectUserArray);
        var Members=Infos.Members;
        var IMNrs =Infos.IMNrs;
        var Content = Infos.Content;
        if(Members.length == 0){
            alert('请至少选择一个人')
            return;
        } else {

            var MemberNrs = IMNrs;
            MemberNrs.push(this.props.Members[0].IMNr);
            var message={
                MemberNrs:MemberNrs,
            }



            Chat.CreateGroup(message,(response)=>{

                this.store.isLoading=false;


                Chat.createConversation(this.props.navigator,response.IMNr,Content,'Group',(conversation)=>{


                    var tempContent = '你邀请'+Content + '加入了群聊';
                    Chat.insertNotificationMessage(response.IMNr,"Group",tempContent);
                })


            });



        }



    }

    //标签拉人
    TagAdd  = () =>{

        this.props.getContact(this.store.selectUserArray);
        this.props.navigator.pop();

    }


    //转接客服
    ChooseCS = ()=>{

        this.props.getContact(this.store.selectUserArray);
        this.props.navigator.pop();

    }


    _getMembersAndIMNrsAndContent(Array) {

        var Members = [];
        var IMNrs = [];
        var Content = '';
        var length = Array.length;
        for (var i = 0; i < length; i++) {

            Members.push(Array[i].User);
            if (Array[i].User && Array[i].User.Name) {
                Content = Content + '' + Array[i].User.Name + ',';
            } else {

            }

            if (Array[i].User && Array[i].User.IMNr) {
                IMNrs.push(Array[i].User.IMNr);
            } else {
                IMNrs.push(Array[i]);
            }
        }

        return {

            Members: Members,
            IMNrs: IMNrs,
            Content: Content,
        }



    }


    //删除对应的账户
    _DeleteIMNr = (IMNr) => {

        //将和这个IMNr相关的User都变为可选中状态
        var FindIndex = this.store.CurrentContacts.findIndex(o => o.User.IMNr == IMNr)
        //修改起状态
        this.store.CurrentContacts[FindIndex].isSelect = false

    }

    _renderSingleRecentlyContact = (data) => {


        var margin = 10;
        var iconW = 30;
        var iconH = iconW;
        var FaceUrlPath = Chat.getFaceUrlPath(data.User.FaceUrlPath);
        var Name = data.User.Name;
        var icon = data.isSelect ? '0xe176' : '0xe174';

        if (data.isShow){
            return(
                <TouchableOpacity onPress={() => {


                    //单选
                    if(this.props.isSingleSelect && this.props.isSingleSelect==true){


                        for (j = 0; j < this.store.CurrentContacts.length; j++) {
                            //遍历通讯录；如果有和最近一样的，则修改
                            this.store.CurrentContacts[j].isSelect = false;
                        }

                        var FindIndex = this.store.CurrentContacts.findIndex(o => o.User.IMNr == data.User.IMNr)
                        this.store.CurrentContacts[FindIndex].isSelect = true;

                    }else{



                        //多选
                        var currentSelect = !data.isSelect;

                        var FindIndex = this.store.CurrentContacts.findIndex(o => o.User.IMNr == data.User.IMNr)
                        //修改起状态
                        this.store.CurrentContacts[FindIndex].isSelect = currentSelect
                    }





                }}>
                    <View
                        style={[{ backgroundColor: 'white', flexDirection: 'row' }]}>

                        <View style={[{ marginLeft: margin, justifyContent: 'center', alignItems: 'center' }]}>
                            <Icon icon={icon} color={'red'} />

                        </View>

                        <Image style={{
                            margin: margin,
                            resizeMode: 'cover',
                            width: iconW,
                            height: iconH,
                            borderRadius: iconW / 2
                        }}
                               source={{ uri: FaceUrlPath }}>
                        </Image>

                        <View style={[{ justifyContent: 'center', alignItems: 'center' }]}>

                            <Text style={{ fontSize: Chat.ContactComponent.fontSize, color: Colors.colors.Chat_Color51 }}>{Name}</Text>

                        </View>

                    </View>
                    <View style={{ backgroundColor: Colors.colors.Chat_Color235, height: 0.5 }}></View>

                </TouchableOpacity>
            )
        }
        return null


    }

    _renderSingleSelectUser = (data) => {

        //需要区分好数据来源是来自通讯录，还是来自最近联系人；两者的数据结构不一样


        var margin = 10;
        var iconW = 30;
        var iconH = iconW;
        var FaceUrlPath = Chat.getFaceUrlPath(data.User.FaceUrlPath);
        return (


            <TouchableOpacity onPress={() => {

                this._DeleteIMNr(data.User.IMNr)


            }}>
                <Image style={{
                    margin: margin,
                    resizeMode: 'cover',
                    width: iconW,
                    height: iconH,
                }}
                    source={{ uri: FaceUrlPath }}>
                </Image>
            </TouchableOpacity>

        )


    }

    _renderRecentlyContact = () => {


        var RecentlyrArray;



        RecentlyrArray = this.store.CurrentContacts.filter(item => item.isRecently == true);



        if (RecentlyrArray && RecentlyrArray.length > 0) {

            return (

                <View>

                    <View style={{ backgroundColor: 'rgb(240,240,240)' }}>
                        <Text style={{ margin: 5, marginLeft: 15 }}>{'最近联系人'}</Text>
                    </View>


                    {
                        RecentlyrArray.map((data) => {
                            return this._renderSingleRecentlyContact(data)
                        })

                    }

                    <View style={{ backgroundColor: 'rgb(240,240,240)' }}>
                        <Text style={{ margin: 5, marginLeft: 15 }}>{'通讯录'}</Text>
                    </View>


                </View>


            )

        }

        return null


    }


    _renderSelectContact = () => {

        if (this.store.selectUserArray && this.store.selectUserArray.length > 0) {

            return (

                    <View style={{flexDirection:'row'}}>

                    <ScrollView horizontal={true}>

                        <View
                            style={{ flexDirection: 'row', flex: 1 }}>
                            {
                                this.store.selectUserArray.map((data) => {
                                    return this._renderSingleSelectUser(data)
                                })
                            }
                        </View>
                    </ScrollView>
                    </View>

            )

        }

        return null



    }


    _renderHeader = () => {


        return (

            <View>

                {this._renderRecentlyContact()}


            </View>


        )


    }


    _renderSearchBar = () =>{

        return(

            <View style={{height:44}}>



                    <View style={{borderColor:'rgb(255,255,255)', flex:1,justifyContent:'center',alignItems:'center',flexDirection:'row'}}>

                        <Text style={{fontFamily:'iconfontim',margin:10,color:'rgb(153,153,153)',fontSize:16}}>{String.fromCharCode('0xe171')}</Text>

                        <TextInput style={{flex:1, fontSize:13,}} placeholderTextColor={'rgb(153,153,153)'}
                                   placeholder={"搜索"}
                                   underlineColorAndroid="transparent"
                                   returnKeyType={'search'}
                                   onEndEditing={()=>{
                                       this._SearchData();
                                   }}
                                   onChangeText={(Text)=>{

                                       if(Text.length == 0){

                                           //如果空的话，则全部数据显示出来



                                       }else{
                                           this.store.keyWord = Text;

                                       }


                                       //这里进行搜索


                                   }}

                        >


                        </TextInput>

                    </View>

                <View style={{ backgroundColor: 'rgb(240,240,240)', height: 0.5 }}></View>



            </View>

        )

    }

    _renderTop = ()=>{

        return (

            <View style={{ backgroundColor:'rgb(255,255,255)' }}>

                {this._renderSearchBar()}
                {this._renderSelectContact()}

                <View style={{ backgroundColor:this.store.selectUserArray.length>0? 'rgb(153,153,153)':'rgb(255,255,255)',width:window.width,height: 0.5,marginBottom:0,marginLeft:0}}></View>

            </View>

        )



    }

    _renderNav = () => {

        var rightTitle = "完成";

        if(this.store.selectUserArray.length>0){
            rightTitle = "完成"+"("+this.store.selectUserArray.length+")";
        }else {
            rightTitle = "完成";
        }

        return (

            <YQFNavBar leftIcon={'0xe183'}
                rightText={rightTitle}
                title={'选择联系人'}
                onLeftClick={() => { this.props.navigator.pop() }}
                onRightClick={() => { this._ComfirmData() }}


            />

        )
    }


    _renderListView() {

        return (

            <ListView
                dataSource={this.store.getDataSource}
                enableEmptySections={true}
                renderRow={this._renderSingleRecentlyContact.bind(this)}
                renderHeader={this._renderHeader.bind(this)}
                removeClippedSubviews={false}

            ></ListView>
        )
    }



    _renderLoading = () =>{

        if(this.store.isLoading == true){

                <ActivityIndicator toast text={this.store.loadingText} animating={this.store.isLoading}/>
        }
        return null;
    }

    render() {

        return (
            <View style={{ flex: 1, backgroundColor: 'rgb(220,220,220)' }}>


                {this._renderNav()}

                {this._renderTop()}
                {this._renderListView()}
                {this._renderLoading()}


            </View>
        );
    }


}

