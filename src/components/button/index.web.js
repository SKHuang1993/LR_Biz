import React from 'react';
import classNames from 'classnames';
import Icon from '../icon/index.web';
import splitObject from '../_util/splitObject';
import Touchable from 'rc-touchable';
const rxTwoCNChar = /^[\u4e00-\u9fa5]{2}$/;
const isTwoCNChar = rxTwoCNChar.test.bind(rxTwoCNChar);
function isString(str) {
    return typeof str === 'string';
}
// Insert one space between two chinese characters automatically.
function insertSpace(child) {
    if (isString(child.type) && isTwoCNChar(child.props.children)) {
        return React.cloneElement(child, {}, child.props.children.split('').join(' '));
    }
    if (isString(child)) {
        if (isTwoCNChar(child)) {
            child = child.split('').join(' ');
        }
        return <span>{child}</span>;
    }
    return child;
}
class Button extends React.Component {
    render() {
        let [{ children, className, prefixCls, type, size, inline, across, disabled, icon, loading, activeStyle, }, restProps] = splitObject(this.props, ['children', 'className', 'prefixCls', 'type', 'size', 'inline', 'across',
            'disabled', 'icon', 'loading', 'activeStyle']);
        const wrapCls = {
            [className]: className,
            [prefixCls]: true,
            [`${prefixCls}-primary`]: type === 'primary',
            [`${prefixCls}-ghost`]: type === 'ghost',
            [`${prefixCls}-warning`]: type === 'warning',
            [`${prefixCls}-small`]: size === 'small',
            [`${prefixCls}-inline`]: inline,
            [`${prefixCls}-across`]: across,
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-loading`]: loading,
        };
        const iconType = loading ? 'loading' : icon;
        const kids = React.Children.map(children, insertSpace);
        if (iconType) {
            wrapCls[`${prefixCls}-icon`] = true;
        }
        // use div, button native is buggy @yiminghe
        return (<Touchable activeClassName={activeStyle ? `${prefixCls}-active` : undefined} disabled={disabled} activeStyle={activeStyle}>
        <a {...restProps} role="button" className={classNames(wrapCls)} disabled={disabled} onClick={disabled ? () => { } : this.props.onClick}>
          {iconType ? <Icon type={iconType}/> : null}
          {kids}
        </a>
      </Touchable>);
    }
}
Button.defaultProps = {
    prefixCls: 'am-button',
    size: 'large',
    inline: false,
    across: false,
    disabled: false,
    loading: false,
    activeStyle: {},
};
export default Button;
