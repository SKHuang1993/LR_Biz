import React from 'react';
import { Text, ScrollView, Dimensions } from 'react-native';
import Modal from './Modal';
;
export default class AlertContainer extends React.Component {
    constructor(props) {
        super(props);
        this.onClose = () => {
            this.setState({
                visible: false,
            });
        };
        this.state = {
            visible: true,
        };
    }
    render() {
        const { title, actions, content, onAnimationEnd } = this.props;
        const footer = actions.map((button) => {
            const orginPress = button.onPress || function () {
            };
            button.onPress = () => {
                orginPress();
                this.onClose();
            };
            return button;
        });
        return (<Modal transparent title={title} visible={this.state.visible} onClose={this.onClose} footer={footer} onAnimationEnd={onAnimationEnd}>
            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.7 }}>
                {typeof (content) === "string" ?
                    <Text>{content}</Text>
                    : content}
            </ScrollView>
        </Modal>);
    }
}
