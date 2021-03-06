import React from 'react';
import PopupCascader from 'rmc-cascader/lib/Popup';
//import PopupCascader from '../../components/rmc-cascader/lib/Popup';
import Cascader from 'rmc-cascader/lib/Cascader';
import MultiPicker from 'rmc-picker/lib/MultiPicker';
import treeFilter from 'array-tree-filter';
import styles from './styles';
import popupProps from './popupProps';


import { BaseComponent } from '../locale';
let lan = BaseComponent.getLocale();

function getDefaultProps() {
    const defaultFormat = (values) => {
        return values.join(',');
    };
    return {
        prefixCls: 'am-picker',
        pickerPrefixCls: 'am-picker-col',
        popupPrefixCls: 'am-picker-popup',
        triggerType: "onClick",
        format: defaultFormat,
        cols: 3,
        cascade: true,
        value: [],
        extra: lan.flights_selectHint,
        okText: lan.confirm,
        dismissText: lan.cancel,
        title: '',
        styles,
        actionTextUnderlayColor: 'transparent',
        getType: () => "Picker"
    };
}
export default class Picker extends React.Component {
    constructor() {
        super(...arguments);
        this.getSel = () => {
            const value = this.props.value || [];
            let treeChildren;
            if (this.props.cascade) {
                treeChildren = treeFilter(this.props.data, (c, level) => {
                    return c.value === value[level];
                });
            }
            else {
                treeChildren = value.map((v, i) => {
                    return this.props.data[i].filter(d => d.value === v)[0];
                });
            }
            return this.props.format && this.props.format(treeChildren.map((v) => {
                return v.label;
            }));
        };
    }
    render() {
        const { props } = this;
        const { children, value, extra, okText, dismissText, popupPrefixCls, cascade } = props;
        let cascader;
        let popupMoreProps = {};
        if (cascade) {
            cascader = (<Cascader prefixCls={props.prefixCls} pickerPrefixCls={props.pickerPrefixCls} data={props.data} cols={props.cols} />);
        }
        else {
            cascader = (<MultiPicker prefixCls={props.prefixCls} pickerPrefixCls={props.pickerPrefixCls}>
                {props.data.map(d => {
                    return {
                        props: {
                            children: d,
                        },
                    };
                })}
            </MultiPicker>);
            popupMoreProps = {
                pickerValueProp: 'selectedValue',
                pickerValueChangeProp: 'onValueChange',
            };
        }
        return (<PopupCascader cascader={cascader} {...popupProps} {...props} prefixCls={popupPrefixCls} value={value} dismissText={lan.cancel} okText={lan.confirm} {...popupMoreProps}>
            {React.cloneElement(children, { extra: this.getSel() || extra, extraTextStyle: this.getSel() ? { color: '#333' } : { color: '#c7c7cd' } })}
        </PopupCascader>);
    }
}
Picker.defaultProps = getDefaultProps();
