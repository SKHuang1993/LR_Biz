/**
 * Created by yqf on 2018/10/26.
 */


//封装一些常见的按钮


/**
 * Created by yqf on 2017/10/25.
 */

import React, { Component } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


/**
 *
 * onPress代表点击事件
 * size 尺寸
 * title 文字
 * titleStyle
 * iconStyle
 *
 * style 样式
 *
 *
 * */





export default class YQFButton extends Component{



    render(){


        var iconStyle={fontSize:18,color:'rgb(255,255,255)'};
        var titleStyle= {fontSize:12,color:'rgb(255,255,255)'};


        return(


            <TouchableOpacity style={[{alignItems:'center',justifyContent:'space-between'},this.props.style]} onPress = {this.props.onPress}>

                <Text style={[{fontFamily:'iconfontim'},iconStyle, this.props.iconStyle]}>
                    {String.fromCharCode(this.props.icon)}
                </Text>

                <Text style={[titleStyle, this.props.titleStyle]}>
                    {this.props.title}
                </Text>

            </TouchableOpacity>


        )
    }

}