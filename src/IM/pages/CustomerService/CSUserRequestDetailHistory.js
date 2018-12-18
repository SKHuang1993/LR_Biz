/**
 * Created by yqf on 2018/10/25.
 */
/**
 * Created by yqf on 2018/10/24.
 */

//获取用户的请求历史详情



import { observer } from 'mobx-react/native';
import {observable, autorun,computed,action} from 'mobx'
import {Component} from 'react';
import React, { PropTypes } from 'react';

import {ServingClient} from '../../utils/yqfws';
import YQFNavBar from '../../components/yqfNavBar';
import Icon from '../../components/icon';


import {Chat}  from '../../utils/chat'
import ActivityIndicator from '../../components/activity-indicator/index'

import {
    TouchableHighlight,
    TouchableOpacity,
    StyleSheet,
    Image,
    ListView,
    Text,
    View,
    RefreshControl,
    Dimensions,
    BackHandler
} from 'react-native';


let window={

    width:Dimensions.get('window').width,
    height:Dimensions.get('window').height,

}


class CSUserRequestDetailHistoryModel extends Component {


    @observable isShow = false; // 是否显示对应的转接请求

    @observable loading = true;
    //模版
    @observable TemplateArray =[];

    @observable Forwardings =[];


    @computed get getDataSource(){

        ds = new ListView.DataSource({rowHasChanged:(r1,r2)=>r1 !==r2});
        return ds.cloneWithRows(this.TemplateArray.slice());
    }

    @computed get getForwardingsSource(){

        ds = new ListView.DataSource({rowHasChanged:(r1,r2)=>r1 !==r2});
        return ds.cloneWithRows(this.Forwardings.slice());
    }

}




@observer

export default class CSUserRequestDetailHistory extends Component {

    constructor(props){

        super(props);

        this.store = new CSUserRequestDetailHistoryModel();

    }


    componentDidMount = ()=>{

        this._fetchData()
    }


    _fetchData = async()=>{

        //#TODO 历史请求记录最好最好是要加入分页。因为有可能这个页面会出现很多历史数据

        this.store.loading = true;


        //#TODO 后期需要切换成对应的正确的客户IM号和用户IM号
        var param ={

            ServiceIMNr:Chat.userInfo.User.IMNr,  //客服IM号
            UserIMNr:this.props.data.User.UserId,//	用户IM号

            // ServiceIMNr:"3177",  //客服IM号
            // UserIMNr:'10013808',//	用户IM号

            // ServiceIMNr:"1111",  //客服IM号
            // UserIMNr:'1222',//	用户IM号
        };

        var result = await  ServingClient.execute('IM.GetCSUserRequestDetailHistory',param);
        // console.dir(result);

        if(result && result.RequestDetails && result.RequestDetails.length>0){
            this.store.loading = false;
            this.store.TemplateArray = result.RequestDetails.reverse();
        }

        else {

            this.store.loading = false;
            this.store.isEmpty = true;
        }
    }



    //#TODO   _GetTimeTextBySeconds 这个方法需要再进行调试，如果18000，需要返回5时
    _GetTimeTextBySeconds = (second) =>{

        var h,m,s,content="";
        h = parseInt(second / 3600);
        if(h==0){
           m = parseInt(second/60) ;

           //如果m == 0 代表时间不足1分钟，都是秒数
           if(m==0){

               s = second;

           }else{

               s = second - m * 60;
           }

        }else{


            m = parseInt( (second - h * 3600) / 60);

            //如果m == 0 代表时间不足1分钟，都是秒数
            if(m==0){
                s = second;

            }else{

                s = second - m * 60;
            }

        }


        if(h>0){
            content += h + '时'
        }
        if(m>0){
            content += m + '分'
        }
        if(s>0){
            content += s  + '秒'
        }

        if(second){

            return content;

        }else {
            return "请求超时,无应答"
        }



    }


    //获取时间  2018-10-24T0：04：58
    _GetTimeTextByDate = (date) =>{



        var str = String(date).substring(0,16);

        var a = str.replace('T'," ");

        return a;

    }

    //弹出转接请求框
    _showForwarding = (data) =>{

        if(data.ForwardingCount>0 && data.Forwardings){

            this.store.isShow = true;
            this.store.Forwardings = data.Forwardings.slice();//复制数组到转接请求


        }

    }

    renderShowDiaload = () =>{

        if (this.store.isShow ==false){
            return null
        }else {

            var height = 250;
            var top = (window.height - height) / 2;

            return(

                <View style={{position:'absolute',top:0,bottom:0,left:0,right:0,
                    backgroundColor:'rgba(0,0,0,0)'}}>

                    <TouchableOpacity style={{position:'absolute',top:0,bottom:0,left:0,right:0,
                        backgroundColor:'rgba(0,0,0,0.3)'}} onPress={()=>{

                        this.store.isShow = false;
                    }
                    }>


                    </TouchableOpacity>



                    <View style={{position:'absolute',left:20,right:20,top:top,height:height, backgroundColor:'rgb(255,255,255)', borderRadius:5, overflow:'hidden'}}>

                        <View style={{alignItems:'center',justifyContent:'space-between',flexDirection:'row',margin:10}}>

                            <Text>{''}</Text>
                            <Text style={{color:'#333',fontSize:16}}>{'转接记录'}</Text>
                            <Icon onPress={()=>{this.store.isShow=false}} icon='0xe198' size={18} color={'#999'} />
                        </View>


                        <ListView
                            dataSource={this.store.getForwardingsSource}
                            enableEmptySections={true}
                            renderRow={this.renderForwardingsRow}
                            removeClippedSubviews={false}
                        ></ListView>




                    </View>


                </View>

            );




        }



    }


    //每个data里面有name和content
    renderSingleText = (data) =>{


        if(data.name=="接待客服") {
            // console.log('接待客服   特别处理');
            // console.dir(data)
        }


        var content;
        var rightTextStyle={color:'#999'};

        if(data.content=='请求超时,无应答') {
            content = data.content;
            rightTextStyle={color:'rgb(244,72,72)'};
        }else{
            content = data.content;

        }



        if(data.name =='转接次数'){

            if(data.content=='请求超时,无应答'){

                rightTextStyle={color:'rgb(244,72,72)'};
            }else{
                content = data.content +'次';

            }


        }




        return(


            <View>

            <View style={{margin:5,marginLeft:20,marginRight:20, flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>

                <Text style={{color:'#666',margin:5,fontSize:16}}>{data.name}</Text>
                <Text style={[rightTextStyle,{margin:5,fontSize:16}]}>{content}</Text>

            </View>

               <View style={{width:window.width,height:1,backgroundColor:'rgb(235,235,235)'}}></View>

            </View>


        )

    }


    renderForwardingsRow = (data,sectionID,rowID) =>{

        var array = []

        var d1 = {
            name:"请求时间",
            content: this._GetTimeTextByDate(data.ForwardingTime)
        };
        var d2 = {
            name:"转接客服",
            content:data.ServiceName ? data.ServiceName :'请求超时,无应答'
        };
        array.push(d1,d2);

        var index = parseInt(rowID)+1;

        return(

            <View>

                <View style={{backgroundColor:'rgb(255,255,255)'}}>

                    <Text style={{color:'#999',marginLeft:20}}>{'第 '+index+' 次'}</Text>
                    {
                        array.map((item)=>{
                            return this.renderSingleText(item,rowID)
                        })

                    }
                </View>

                <View style={{height:3, backgroundColor:'rgb(235,235,235)', width:window.width}}></View>


            </View>

        )


    }


    renderRow = (data)=>{


        //在这里将数据整理，接着用map进行显示
        //请求时间
        var array = []

        var d1 = {
            name:"请求时间",
            content: this._GetTimeTextByDate(data.RequestBeginTime)
        };

        var d2 = {
            name:"请求来源",
            content:data.UserSource
        };
        var d3 = {
            name:"接待客服",
            content:data.ServiceName ? data.ServiceName :'请求超时,无应答'
        };
        var d4 = {
            name:"请求等待",
            content: this._GetTimeTextBySeconds(data.RequestElapsedSenconds)
        };
        var d5 = {
            name:"转接次数",
            content:data.ForwardingCount
        };
        var d6 = {
            name:"聊天时长",
            content: this._GetTimeTextBySeconds(data.ChatElapsedSenconds)
        };

        array.push(d1,d2,d3,d4,d5,d6);


        return(

        <TouchableOpacity  onPress={()=>{ this._showForwarding(data)}}>

            <View style={{backgroundColor:'rgb(255,255,255)'}}>
            {
                array.map((item)=>{

                    return this.renderSingleText(item)

                })

            }
            </View>

            <View style={{height:7, backgroundColor:'rgb(232,232,232)', width:window.width}}></View>


        </TouchableOpacity>

        )
    }


    renderLoading = ()=>{


        if (this.store.loading) {

            return <ActivityIndicator toast text={this.store.loadingText} animating={this.store.loading}/>

        }

        return null;

    }




    renderListview = ()=>{

            return(

                <ListView
                    dataSource={this.store.getDataSource}
                    enableEmptySections={true}
                    renderRow={this.renderRow}
                    removeClippedSubviews={false}
                ></ListView>

            )

    }
    //导航条
    renderNavBar=()=>{

        var data = this.props.data;

        var title = data.User.UserName +' '  + this.store.TemplateArray.length +'条记录';

        return(
            <YQFNavBar  leftIcon={'0xe183'}
                        onLeftClick={()=>{this.props.navigator.pop()}}
                        title={title}/>
        )
    }


    render = ()=>{

        return(

            <View style={{flex:1,backgroundColor:'rgb(240,240,240)'}}>


                {this.renderNavBar()}

                {this.renderLoading()}

                {this.renderListview()}

                {this.renderShowDiaload()}


            </View>
        )

    }



}













