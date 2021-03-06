import React from 'react';
import assign from 'object-assign';
import { View, Image, Text, TextInput, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import variables from '../style/themes/default';
import InputItemStyle from './style/index';
const noop = () => {
};
function fixControlledValue(value) {
    if (typeof value === 'undefined' || value === null) {
        return '';
    }
    return value;
}
export default class InputItem extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            error: false
        }
        this.onChange = (text) => {
            const { maxLength, onChange, type } = this.props;
            switch (type) {
                case 'text':
                    if (maxLength > 0) {
                        text = text.substring(0, maxLength);
                    }
                    break;
                case 'bankCard':
                    text = text.replace(/\D/g, '');
                    if (maxLength > 0) {
                        text = text.substring(0, maxLength);
                    }
                    text = text.replace(/\D/g, '').replace(/(....)(?=.)/g, '$1 ');
                    break;
                case 'phone':
                    text = text.replace(/\D/g, '');
                    if (maxLength > 0) {
                        text = text.substring(0, 11);
                    }
                    const valueLen = text.length;
                    if (valueLen > 3 && valueLen < 8) {
                        text = `${text.substr(0, 3)} ${text.substr(3)}`;
                    }
                    else if (valueLen >= 8) {
                        text = `${text.substr(0, 3)} ${text.substr(3, 4)} ${text.substr(7)}`;
                    }
                    break;
                case 'number':
                    text = text.replace(/\D/g, '');
                    break;
                case 'password':
                    break;
                default:
                    break;
            }
            if (this.props.validator && !this.props.validator(text)) {
                this.setState({ error: true });
            } else {
                this.setState({ error: false });
            }
            if (onChange) {
                onChange(text);
            }
        };
        this.onInputBlur = () => {
            if (this.props.onBlur) {
                this.props.onBlur(this.props.value);
            }
        };
        this.onInputFocus = () => {
            if (this.props.onFocus) {
                this.props.onFocus(this.props.value);
            }
        };
    }
    componentDidMount() {
        if (this.props.autoFocus || this.props.focused) {
            this.refs.input.focus();
        }
    }
    componentDidUpdate() {
        // if (this.props.focused) {
        //     this.refs.input.focus();
        // }
    }
    componentWillReceiveProps(props) {
        if (this.props.validator && !this.props.validator(props.value)) {
            this.setState({ error: true });
        } else {
            this.setState({ error: false });
        }
    }

    render() {
        const { optional, validate, value, defaultValue, type, style, clear, children, extra, labelNumber, last, onExtraClick = noop, onErrorClick = noop, styles, } = this.props;
        let error = this.props.error ? this.props.error : this.state.error;
        let valueProps;
        if ('value' in this.props) {
            valueProps = {
                value: fixControlledValue(value),
            };
        }
        else {
            valueProps = {
                defaultValue,
            };
        }
        const containerStyle = {
            borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        };
        const textStyle = {
            width: variables.font_size_heading * labelNumber * 1.05,
            //backgroundColor:'red'
        };
        const inputStyle = {
            color: error ? '#f50' : variables.color_text_base,
            //backgroundColor:'red',
            paddingLeft: 0,
        };
        const extraStyle = {
            width: typeof extra === 'string' && extra.length > 0 ?
                extra.length * variables.font_size_heading : 0,
        };
        const restProps = assign({}, this.props);
        [
            'type', 'clear', 'children', 'error', 'extra', 'labelNumber', 'last',
            'onExtraClick', 'onErrorClick', 'styles',
        ].forEach(prop => {
            if (restProps.hasOwnProperty(prop)) {
                delete restProps[prop];
            }
        });
        const keyboardTypeArray = ['default', 'email-address',
            'numeric', 'phone-pad', 'ascii-capable', 'numbers-and-punctuation',
            'url', 'number-pad', 'name-phone-pad', 'decimal-pad', 'twitter', 'web-search'];
        let keyboardType = 'default';
        if (type === 'number' || type === 'bankCard') {
            keyboardType = 'numeric';
        }
        else if (type && keyboardTypeArray.indexOf(type) > -1) {
            keyboardType = type;
        }
        return (<View style={[styles.container, containerStyle, style]}>
            {children ? <Text style={[styles.text, textStyle]}>{children}{validate && !optional && <Text style={{ color: "#fa5e5b" }}>*</Text>}</Text> : null}
            <TextInput ref="input" clearButtonMode={clear ? 'while-editing' : 'never'} underlineColorAndroid="transparent" {...restProps} {...valueProps} style={[styles.input, inputStyle]} keyboardType={keyboardType} onChange={(event) => this.onChange(event.nativeEvent.text)} secureTextEntry={type === 'password'} onBlur={this.onInputBlur} onFocus={this.onInputFocus} />
            {extra ? <TouchableWithoutFeedback onPress={onExtraClick}>
                <View>
                    {typeof extra === 'string' ? <Text style={[styles.extra, extraStyle]}>{extra}</Text> : extra}
                </View>
            </TouchableWithoutFeedback> : null}
            {error &&
                <TouchableWithoutFeedback onPress={onErrorClick}>
                    <View style={[styles.errorIcon]}>
                        <Image source={require('../style/images/error.png')} style={{ width: variables.icon_size_xs, height: variables.icon_size_xs }} />
                    </View>
                </TouchableWithoutFeedback>}
        </View>);
    }
}

InputItem.defaultProps = {
    type: 'text',
    editable: true,
    clear: true,
    onChange: noop,
    onBlur: noop,
    onFocus: noop,
    extra: '',
    onExtraClick: noop,
    error: false,
    onErrorClick: noop,
    size: 'large',
    labelNumber: 4,
    labelPosition: 'left',
    textAlign: 'left',
    last: false,
    styles: InputItemStyle,
    focused: false,
    getType: () => "InputItem"
};
