import React from 'react';
import { View, Text, TouchableHighlight, Image } from 'react-native';
import { ListView } from 'antd-mobile';
import assign from 'object-assign';
const data = [
    {
        img: 'https://zos.alipayobjects.com/rmsportal/dKbkpPXKfvZzWCM.png',
        title: '相约酒店',
        des: '不是所有的兼职汪都需要风吹日晒',
    },
    {
        img: 'https://zos.alipayobjects.com/rmsportal/XmwCzSeJiqpkuMB.png',
        title: '麦当劳邀您过周末',
        des: '不是所有的兼职汪都需要风吹日晒',
    },
    {
        img: 'https://zos.alipayobjects.com/rmsportal/hfVtzEhPzTUewPm.png',
        title: '食惠周',
        des: '不是所有的兼职汪都需要风吹日晒',
    },
];
let index = data.length - 1;
const NUM_ROWS = 20;
let pageIndex = 0;
export default React.createClass({
    getInitialState() {
        const dataSource = new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
        });
        this.genData = (pIndex = 0) => {
            const dataBlob = {};
            for (let i = 0; i < NUM_ROWS; i++) {
                const ii = (pIndex * NUM_ROWS) + i;
                dataBlob[`${ii}`] = `row - ${ii}`;
            }
            return dataBlob;
        };
        this.rData = {};
        return {
            dataSource: dataSource.cloneWithRows(this.genData()),
            isLoading: false,
        };
    },
    onEndReached(_event) {
        // load new data
        // console.log('reach end', event);
        this.setState({ isLoading: true });
        setTimeout(() => {
            this.rData = assign({}, this.rData, this.genData(++pageIndex));
            this.setState({
                dataSource: this.state.dataSource.cloneWithRows(this.rData),
                isLoading: false,
            });
        }, 1000);
    },
    render() {
        const separator = (sectionID, rowID) => (<View key={`${sectionID}-${rowID}`} style={{
            backgroundColor: '#F5F5F9',
            height: 8,
            borderStyle: 'solid',
            borderTopWidth: 1,
            borderTopColor: '#ECECED',
            borderBottomWidth: 1,
            borderBottomColor: '#ECECED',
        }}></View>);
        const row = (_rowData, sectionID, rowID, highlightRow = (_sId, _rId) => { }) => {
            if (index < 0) {
                index = data.length - 1;
            }
            const obj = data[index--];
            return (<View key={rowID}>
        <TouchableHighlight underlayColor={'rgba(100,100,100,0.2)'} style={[{
                    padding: 8,
                    backgroundColor: 'white',
                }]} onPress={() => {
                highlightRow(sectionID, rowID);
            }}>
          <View>
            <View style={[{
                    marginBottom: 8,
                    borderStyle: 'solid',
                    borderBottomWidth: 1,
                    borderBottomColor: '#F6F6F6',
                }]}>
              <Text style={{
                fontSize: 18,
                fontWeight: '500',
                padding: 2,
            }}>{obj.title}</Text>
            </View>
            <View style={[{
                    flexDirection: 'row',
                }]}>
              <Image style={[{ height: 64, width: 64, marginRight: 8 }]} source={{ uri: obj.img }}/>
              <View>
                <Text>{obj.des} - {rowID}</Text>
                <Text>{this.props.highlightRow}</Text>
                <Text><Text style={[{ fontSize: 24, color: '#FF6E27' }]}>35</Text>元/任务</Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>);
        };
        return (<ListView dataSource={this.state.dataSource} renderHeader={() => <Text>header</Text>} renderFooter={() => <Text style={{ padding: 30, textAlign: 'center' }}>
          {this.state.isLoading ? '加载中...' : '加载完毕'}
        </Text>} renderRow={row} renderSeparator={separator} pageSize={4} scrollRenderAheadDistance={500} scrollEventThrottle={20} onEndReached={this.onEndReached} onEndReachedThreshold={10} onChangeVisibleRows={(_visibleRows, _changedRows) => {
            /* tslint no-console: 0 */
            // console.log(visibleRows, changedRows);
        }}/>);
    },
});
export const title = 'ListView Row';
export const description = 'ListView Row example';
