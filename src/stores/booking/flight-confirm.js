import { BaseComponent } from '../../components/locale';
let lan = BaseComponent.getLocale();
import { extendObservable, action, computed, toJS, observable } from 'mobx';
import { Alert, NativeModules, ListView } from 'react-native';
import Enumerable from 'linq';
import { RestAPI } from '../../utils/yqfws';
import { PassengerInfo, CertificateInfo, CostInfo, ApproveInfo, RoleInfo, PolicyInfo, DepartmentInfo, EmployeeInfo, ReasonInfo } from '../../utils/data-access/';
import moment from 'moment';

export default class FlightConfirm {
    @observable data = [];
    @observable flights = [];
    @observable isLoading = false;
    @observable loadingText = "正在验价...";
    @computed get getDataSource() {
        ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
        return ds.cloneWithRows(this.data.slice());
    }

    //获取条款
    getFlightShoppingTerms = async (ABFareId, AgencyCode) => {
        try {
            let obj = {
                "Agency": AgencyCode,
                "ABFareId": ABFareId
            };
            let result = await RestAPI.execute("IntlAir.FlightShoppingTerms", obj);
            return result.Result.TermText.replace(/\\n/g, '<br>');
        } catch (err) {

        }
    }

    //验价
    verifyPrice = async (officeIds, list, callback) => {
        try {
            let flights = [];
            for (let flight of list) flights.push(toJS(flight));
            Enumerable.from(flights).doAction((o) => o.selectedCabin = o.BerthList[0]).toArray();
            let obj = {
                "OfficeIds": officeIds,
                "Agency": flights[flights.length - 1].AgencyCode,
                "IntlSegments": [],
                "ABFareId": flights[flights.length - 1].ABFareId,
                "AdultQty": 1,
                "ChildQty": 0,
                "IsVerifyCabin": true,
                "IsVerifyPricing": true,
                "IsVerifyRule": false,
                "IsBestBuy": false,
                "PlatingCarrier": flights[0].MarketingAirline,
                "JourneyCode": flights[flights.length - 1].JourneyCode,
                "FQKey": flights[flights.length - 1].FQKey
            }
            for (let flight of flights) {
                let IntlFlights = { "IntlFlights": [] };
                for (let classAvail of flight.Segment.ClassAvail) {
                    IntlFlights.IntlFlights.push(
                        {
                            "Departure": classAvail.Flight.Departure,
                            "Arrival": classAvail.Flight.Arrival,
                            "DepartureDate": classAvail.Flight.DepartureDate,
                            "ArrivalDate": classAvail.Flight.ArrivalDate,
                            "Airline": classAvail.Flight.MarketingAirline,
                            "FlightNumber": classAvail.Flight.FlightNumber,
                            "Cabin": flight.selectedCabin.FlightCOS || classAvail.Flight.FlightCOS,
                        }
                    );
                }
                obj.IntlSegments.push(IntlFlights);
            }
            let result = await RestAPI.execute("IntlAir.IntlAirVerifyPriceV3", obj);

            if (callback) {
                callback(JSON.stringify(obj), JSON.stringify(result.Result));
            }
            if (!result) {
                return result;
            }

            let IntlFlights = [];
            let IntlSegments = result.Result.IntlSegments;
            for (let item of IntlSegments) {
                IntlFlights = IntlFlights.concat(item.IntlFlights);
            }
            let map = new Map();
            for (let item of IntlFlights) {
                map.set(item.Airline + item.Arrival + moment(item.ArrivalDate).format("YYYY-MM-DD HH:mm:ss") + item.Departure + moment(item.DepartureDate).format("YYYY-MM-DD HH:mm:ss") + item.FlightNumber, item);
            }
            for (let flight of flights) {
                let rule = result.Result.Rule;
                let target = flights[flights.length - 1];
                let multiOffices = Enumerable.from(result.Result.Pricings[0].MultiOffices).firstOrDefault(o => o.Agency == target.AgencyCode && o.AgencyRay == target.AgencyRay, result.Result.Pricings[0].MultiOffices[0]);
                if (multiOffices) {
                    let price = multiOffices.SalePrice;
                    let tax = multiOffices.Tax;
                    let total = multiOffices.Total;
                    flight.TotalPrice = total;
                    flight.Tax = tax;
                    flight.Price = flight.selectedCabin.Price = price;
                    flight.selectedCabin = Object.assign({}, flight.selectedCabin, multiOffices.TicketDetails[0]);
                    flight.selectedCabin.TicketPricing[0].EncourageFee = multiOffices.TicketDetails[0].EncourageFee;
                }
                flight.selectedCabin.Rule = `${lan.flights_refundRules}: ${rule.refund}\n${lan.flights_endorseRules}: ${rule.endorse}\n${lan.flights_baggageRules}: ${rule.baggage}\n${lan.other}: ${rule.other}`;
                for (let classAvail of flight.Segment.ClassAvail) {
                    let item = classAvail.Flight;
                    let key = item.MarketingAirline + item.ArrivalInfo.airportCode + item.ArrivalDate + item.DepartureInfo.airportCode + item.DepartureDate + item.FlightNumber;
                    let IntlFlight = map.get(key);
                    if (IntlFlight) {
                        item.Seats = IntlFlight.Seats;
                    }
                }
            }
            return flights;
        } catch (err) {
            return null;
        }
    }
}