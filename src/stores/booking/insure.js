import { BaseComponent } from '../../components/locale';
let lan = BaseComponent.getLocale();
import { extendObservable, action, computed, toJS, observable } from 'mobx';
import { Alert, NativeModules, ListView } from 'react-native';
import Enumerable from 'linq';
import { RestAPI } from '../../utils/yqfws';
import { ProductInfo, PassengerInfo, CertificateInfo, CostInfo, ApproveInfo, RoleInfo, PolicyInfo, DepartmentInfo, EmployeeInfo, ReasonInfo } from '../../utils/data-access/';
import moment from 'moment';
import deepDiffer from 'deepDiffer';

export default class Insurance {
    @observable ProductInsure = {};
    @observable isLoading = false;
    @observable multInsurances = [];
    passengers = [];
    selectedFlights = [];
    constructor(passengers, selectedFlights, insuranceResult, props) {
        this.param = props;
        this.selectedFlights = selectedFlights;
        for (let i = 0; i < selectedFlights.length; i++) {
            let _passengers = [];
            for (let item of passengers) {
                let obj = observable(toJS(item));
                extendObservable(obj, {
                    group: i,
                    checked: false
                })
                _passengers.push(obj);
            }
            if (insuranceResult && insuranceResult.length > 0) {
                Enumerable.from(_passengers).join(insuranceResult[i], "$.PersonCode", "$.PersonCode", (a, b) => { a.checked = b.checked }).toArray();
            }
            if (_passengers.length > 0)
                this.passengers.push(_passengers);
        }
    }

    //获取国内保险
    getDomesticInsure = async (type) => {
        try {
            await this.getProductConfigure(type);
            await this.productQuery();
            let effectiveStart = this.param.departureDates[0];
            let effectiveEnd = this.param.departureDates[this.param.departureDates.length - 1];
            await this.insuranceRateReport(effectiveStart, effectiveEnd);
        } catch (err) {
            this.ProductInsure = {
                "ProductCode": "1206",
                "ProductName": lan.booking_insureProductName1,
                "PlanCode": "A",
                "PlanName": lan.booking_insureProductName2,
                "Provider": "HT",
                "ProviderName": lan.booking_huatai_insurance,
                "ProviderPlanCode": "1206",
                "OfficeID": "30042",
                "ProductPrice": this.ProductInsure.ProductPrice ? this.ProductInsure.ProductPrice : 2.5,
                "SubProductCategoryID": 743,
                "IfProductChecked": this.ProductInsure.IfProductChecked,
                "IfGive": this.ProductInsure.IfGive,
                "Cost": 2.5,
            }
            this.isLoading = false;
        }
    }

    getInsuranceResult = () => {
        let obj;
        let passengers = [];
        for (let passenger of this.passengers) {
            passengers = passengers.concat(passenger);
        }
        let PassengersQty = Enumerable.from(passengers).where(o => o.checked).distinct(o => o.AccountCode).toArray().length;
        let count = Enumerable.from(this.passengers).sum(o => Enumerable.from(o).count(o => o.checked));
        let effectiveStart = this.param.departureDates[0];
        let effectiveEnd = this.param.departureDates[this.param.departureDates.length - 1];
        if (this.param.ticketType != 1) {
            // obj = {
            //   "EffectiveStart": effectiveStart,
            //   "EffectiveEnd": effectiveEnd,
            //   "PassengerIndex": 0,
            //   "ProductCode": "AXWYB",
            //   "ProductName": lan.booking_insureProductName1,
            //   "InsuranceCompanyCode": "HT",
            //   "InsuranceCompanyName": lan.booking_huatai_insurance,
            //   "InsurancePlanCode": "A",
            //   "InsurancePlanName": lan.booking_insureProductName2,
            //   "VendorInsurancePlanCode": "1206",
            //   "DayQty": moment(effectiveEnd).diff(moment(effectiveStart), 'd'),
            //   "AdultPrice": this.ProductInsure.ProductPrice,
            //   "ChildPrice": this.ProductInsure.ProductPrice,
            //   "CurrencyID": 4,
            //   "VendorCode": "30042",
            //   "PassengersQty": count
            // };
            obj = {
                "SubProductCategoryID": this.ProductInsure.SubProductCategoryID,
                "EffectiveStart": effectiveStart,
                "EffectiveEnd": effectiveEnd,
                "PassengerIndex": 0,
                "ProductCode": this.ProductInsure.ProductCode,
                "ProductName": this.ProductInsure.ProductName,
                "InsuranceCompanyCode": this.ProductInsure.Provider,
                "InsuranceCompanyName": this.ProductInsure.ProviderName,
                "InsurancePlanCode": this.ProductInsure.PlanCode,
                "InsurancePlanName": this.ProductInsure.PlanName,
                "VendorInsurancePlanCode": this.ProductInsure.ProviderPlanCode,
                "DayQty": moment(effectiveEnd).diff(moment(effectiveStart), 'd'),
                "AdultPrice": this.ProductInsure.IfGive ? 0 : this.ProductInsure.ProductPrice,
                "ChildPrice": this.ProductInsure.IfGive ? 0 : this.ProductInsure.ProductPrice,
                "VendorUnitPrice": this.ProductInsure.Cost,
                "CurrencyID": 4,
                "VendorCode": this.ProductInsure.OfficeID,
                "IfProductChecked": this.ProductInsure.IfProductChecked,
                "PassengersQty": count
            };
            //console.log(obj);
            return obj;
        } else {
            let multInsurance = Enumerable.from(this.multInsurances).firstOrDefault(o => o.checked, null);
            if (multInsurance) {
                obj = {
                    "SubProductCategoryID": multInsurance.SubProductCategoryID,
                    "EffectiveStart": effectiveStart,
                    "EffectiveEnd": effectiveEnd,
                    "PassengerIndex": 0,
                    "ProductCode": multInsurance.ProductCode,
                    "ProductName": multInsurance.ProductName,
                    "InsuranceCompanyCode": multInsurance.Provider,
                    "InsurancePlanCode": multInsurance.PlanCode,
                    "InsurancePlanName": multInsurance.ProductName,
                    "DayQty": moment(effectiveEnd).diff(moment(effectiveStart), 'd'),
                    "AdultPrice": multInsurance.Premium,
                    "VendorUnitPrice": multInsurance.Cost,
                    "CurrencyID": 4,
                    "VendorCode": multInsurance.OfficeID,
                    "PassengersQty": this.passengers[0].length,
                }
            }
        }
        return obj;
    }

    getProductConfigure = async (type) => {
        this.isLoading = true;
        let param = {
            "CompanyCode": this.userInfo.CorpCode
        }
        let result = await ProductInfo.getProductConfigure(param);
        let content = result.Result.ProductConfigures[0].Content;
        this.ProductInsure = type == 3 ? content.ProductTrain : content.ProductInsure;
        this.isLoading = false;
        return content;
    }

    productQuery = async () => {
        this.isLoading = true;
        let param = {
            "OfficeID": null,
            "ProductCode": this.ProductInsure.ProductCode,
            "ProductCategoryID": "743"
        }
        let result = await ProductInfo.productQuery(param);
        extendObservable(this.ProductInsure, result.Result.Products[0]);
        this.isLoading = false;
    }

    insuranceRateReport = async (start, end) => {
        this.isLoading = true;
        let param = {
            "Start": start,
            "End": end,
            "ProductCode": this.ProductInsure.ProductCode,
            "PlanCode": this.ProductInsure.PlanCode
        }
        let result = await ProductInfo.insuranceRateReport(param);
        let target = Enumerable.from(result.Result.InsuranceRates).firstOrDefault(o => o.InsuredType == "IND", null);
        if (target) {
            extendObservable(this.ProductInsure, target);
            let goodOwners = await ProductInfo.getGoodOwners({
                "GoodTypeCode": "I",
                "PageIndex": 1,
                "PageSize": 100
            });
            let goodOwner = Enumerable.from(goodOwners.Result.GoodOwners).firstOrDefault(o => o.GoodOwnerCode == this.ProductInsure.Provider, null);
            if (goodOwner) {
                this.ProductInsure.ProviderName = goodOwner.OwnerNameCn;
            }
            //console.log(this.ProductInsure);
        } else {
            throw exception();
        }
        this.isLoading = false;
    }

    getProducts = async (productInsure) => {
        try {
            this.isLoading = true;
            let param = {
                "OfficeID": this.userInfo.CorpCode,
                "TravelStartDate": this.param.departureDates[0],
                "TravelEndDate": this.param.departureDates[this.param.departureDates.length - 1],
                "DestinationIataCode": this.param.arrivals[0].cityCode,
                "ProductCategoryID": "4,5,768,803,837,840,839,810,844,834,867,872,854,724",
                "TrafficAir": {}
            };
            let Departures = [];
            let Arrival = [];
            let DepartureDates = [];
            for (let item of this.selectedFlights) {
                let flightStart = item.Segment.ClassAvail[0].Flight;
                let flightEnd = item.Segment.ClassAvail[item.Segment.ClassAvail.length - 1].Flight;
                Departures.push(flightStart.DepartureInfo.cityCode);
                Arrival.push(flightEnd.ArrivalInfo.cityCode);
                DepartureDates.push(flightStart.DepartureDate);
            }
            param.TrafficAir.Departures = Departures;
            param.TrafficAir.Arrivals = Arrival;
            param.TrafficAir.DepartureDates = DepartureDates;
            //console.log(JSON.stringify(param));
            let result = await ProductInfo.productsMultiSearch(param);
            this.multInsurances = Enumerable.from(result.Result.MultInsurances).where(o => o.InsuredType == "IND").doAction(o => {
                o.checked = false;
                if (productInsure && o.ProductCode == productInsure.ProductCode && o.Premium == productInsure.AdultPrice) {
                    o.checked = true;
                }
            }).orderBy("$.Premium").toArray();
            this.isLoading = false;
        } catch (err) {
            console.log(err);
        }
    }

    @computed get getDataSource() {
        ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2,
            sectionHeaderHasChanged: (s1, s2) => s1 !== s2
        });
        return ds.cloneWithRowsAndSections(this.passengers.slice());
    }
}