import { BaseComponent } from '../../components/locale';
let lan = BaseComponent.getLocale();


import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Navigator,
  ListView,
  TouchableOpacity,
  TouchableHighlight,
  Animated
} from 'react-native';

import { WhiteSpace, InputItem, Picker, Popup, Switch } from 'antd-mobile';
import ActivityIndicator from '../../components/activity-indicator';
import Flex from '../../components/flex';
import List from '../../components/list';
import NavBar from '../../components/navBar';
import Icon from '../../components/icons/icon';
import { COLORS, FLEXBOX } from '../../styles/commonStyle'
import Button from '../../components/button';
import Radio from '../../components/radio';
import { observer } from 'mobx-react/native';
import { extendObservable } from 'mobx';
import Insurance from '../../stores/booking/insure'
import PassgerEdit from './passagerEdit';
import Enumerable from 'linq';
import moment from 'moment';
import { CertificateInfo, AccountInfo } from '../../utils/data-access/';
const Item = List.Item;
const Brief = Item.Brief;
const RadioItem = Radio.RadioItem;

@observer
export default class InSure extends Component {

  constructor(props) {
    super(props);
    this.store = new Insurance(props.passengers, props.selectedFlights, props.insuranceResult, props.param);
    this.store.userInfo = AccountInfo.getUserInfo();
    if (props.param.ticketType == 0)
      this.store.getDomesticInsure();
    // else if (this.props.productType === 3) {
    //   this.getTrainInsure();
    // }
    else
      this.store.getProducts(props.productInsure);
  }

  //获取火车保险
  getTrainInsure = async () => {
    this.store.ProductInsure = {
      "ProductCode": "OJS",
      "ProductName": lan.booking_insureProductName1,
      "PlanCode": "A1",
      "PlanName": lan.booking_insureProductName2,
      "Provider": "AIG",
      "ProviderName": null,
      "ProviderPlanCode": "1206",
      "OfficeID": "30042",
      "ProductPrice": 20,
      "SubProductCategoryID": 743
    }
  }

  getLeg = (position) => {
    if (this.props.selectedFlights.length <= 2) {
      return position == 0 ? lan.booking_trip : lan.booking_return_trip;
    } else
      return lan.booking_no + (position + 1) + lan.booking_cheng;
  }

  goRenderRow(rowData: string, sectionID: number, rowID: number) {
    return <InsuranceItem rowData={rowData} />

  }

  render() {
    return (
      <View style={styles.container}>
        <NavBar title={lan.booking_insurance_products} navigator={this.props.navigator} />
        <ScrollView>
          <List style={FLEXBOX.bottomSpace} >
            {this.props.param.ticketType == 0 ?
              <List.Item>
                <Flex>
                  <Text >{this.props.productType === 3 ? '交通意外险' : lan.booking_air_accident_insurance}</Text>
                  <Text style={styles.price}>￥{this.store.ProductInsure.ProductPrice}/{lan.booking_paragraph}/{lan.booking_people}</Text>
                </Flex>
                {this.props.productType != 3 && <Brief style={{ fontSize: 12, }}>{lan.booking_from_take_off_to_landing_all_the_way_for_you_to_guard}！</Brief>}</List.Item>
              : this.store.multInsurances.map((o, i) => <List.Item key={i} check={o.checked} onClick={() => {
                for (let item of this.store.multInsurances)
                  if (item != o) item.checked = false;
                o.checked = !o.checked;
                let temp = o.checked;
                Enumerable.from(this.store.passengers).doAction(o => Enumerable.from(o).doAction(a => a.checked = temp).toArray()).toArray();
              }}>
                <Flex>
                  <Text >{o.ProductName}</Text>
                </Flex>
                <Brief style={{ fontSize: 12, }}>
                  <Text style={styles.price}>￥{o.Premium}/{lan.booking_people}/{lan.booking_share}</Text>
                </Brief></List.Item>)}
          </List>
          {/*保险乘机人*/}
          {this.props.param.ticketType == 0 ?
            <ListView
              enableEmptySections={true}
              dataSource={this.store.getDataSource}
              renderRow={this.goRenderRow.bind(this)}
              renderSectionHeader={(sectionDate, sectionID) => <List bottomLine={false} renderHeader={() => `${this.getLeg(parseInt(sectionID))}${lan.booking_the_insurance_sector}`} />}
            /> : null}
          {/*<List renderHeader={() => lan.booking_the_return_leg_of_insurance}>
            <ListView
              dataSource={this.state.backDataSource}
              renderRow={this.backRenderRow.bind(this)}
            />
          </List>*/}
        </ScrollView>
        {/*{lan.booking_bottom_bar}*/}
        <Button type='barButton' onClick={() => {
          this.props.refresh(this.store.passengers, this.store.getInsuranceResult());
          this.props.navigator.pop();
        }}>{lan.booking_determine}</Button>
        <ActivityIndicator toast text={lan.booking_loading} animating={this.store.isLoading} />
      </View>
    )
  }
}

@observer
class InsuranceItem extends Component {
  render() {
    let rowData = this.props.rowData;
    return <List.Item check={rowData.checked} onClick={() => rowData.checked = !rowData.checked}>{rowData['PersonName'] || rowData['FullName']}</List.Item>
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.containerBg,
  },

  price: {
    color: COLORS.price,
    marginLeft: 10
  }


});

