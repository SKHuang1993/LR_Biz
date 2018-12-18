import React, { Component } from 'react';
import {View,Dimensions,TouchableOpacity,Text,TextInput} from 'react-native';
import YQFNavBar from '../../components/yqfNavBar';
import { Toast } from 'antd-mobile';
import { COLORS } from '../../styles/commonStyle';
import { BaseComponent} from '../../../components/locale';
var lan = BaseComponent.getLocale();
var { width, height } = Dimensions.get('window')

export default class MyOrderDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content:'',
        }
    }

    componentDidMount() {
    }

    render() {
        return(
            <View style={{width:width,height:height}}>
                <YQFNavBar navigator={this.props.navigator} title={'生成委托书'}
                        leftIcon={'0xe183'} rightIcon={'0xe667'}
                        onLeftClick={()=>{this.props.navigator.pop();}} 
                        onRightClick={() => {}}
                />
                <Text style={{marginLeft:15,marginTop:15,fontSize:16,fontWeight:'bold',color:'#333'}}>备注:</Text>
                <View style={{marginLeft:15,marginTop:8,borderColor:'#ccc',borderWidth:.8,width:width-30,height:150}}>
                    <TextInput style={{fontSize:15,flex:1}} multiline={true}
                            onChangeText={(txt)=>{this.state.content = txt;}}
                            placeholder={'输入备注内容'} placeholderTextColor='#999'
                            underlineColorAndroid="transparent" 
                            selectionColor='#333'/>
                </View>
                <Text style={{margin:15,fontSize:13,color:'#666'}}>
                    注：本委托书由手机LR生产（内外供应商，产品小类需由票员重选择）
                </Text>
                <TouchableOpacity style={{marginLeft:15,width:width-30,height:44,borderRadius:8,
                    backgroundColor:COLORS.btnBg,alignItems:'center',justifyContent:'center'}}>
                    <Text style={{fontSize:15,color:'#fff'}}>{lan.submit}</Text>
                </TouchableOpacity>
            </View>
        )
    }
}