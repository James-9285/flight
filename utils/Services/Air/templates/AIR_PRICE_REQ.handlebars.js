module.exports = `
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"> 
    <soap:Body>
        <AirPriceReq AuthorizedBy="user" TargetBranch="{{TargetBranch}}" TraceId="{{requestId}}" {{#if fetchFareRules}} FareRuleType="{{#if long}}long{{else}}short{{/if}}" {{/if}} 
         xmlns="http://www.travelport.com/schema/air_v52_0" xmlns:com="http://www.travelport.com/schema/common_v52_0">
            <com:BillingPointOfSaleInfo OriginApplication="UAPI"/>
            <AirItinerary>
                {{#segments}}
                <AirSegment 
                    Key="{{{uapi_segment_ref}}}"
                    ArrivalTime="{{arrival}}"
                    DepartureTime="{{departure}}"
                    Carrier="{{airline}}"
                    {{#if bookingClass}} ClassOfService="{{bookingClass}}" {{/if}}
                    CabinClass="{{serviceClass}}"
                    Origin="{{from}}"
                    Destination="{{to}}"
                    ETicketability="Yes"
                    Equipment="{{plane}}"
                    FlightNumber="{{flightNumber}}"
                    LinkAvailability="true"
                    PolledAvailabilityOption="Polled avail exists"
                    ProviderCode="{{../provider}}" 
                    Group="{{group}}">
                    {{#if transfer}}
                    <Connection/>
                    {{/if}}
                </AirSegment>
                {{/segments}}
            </AirItinerary>
            {{#if platingCarrier}}
              <AirPricingModifiers PlatingCarrier="{{platingCarrier}}"/>
            {{/if}}
            {{#if business}}
            <AirPricingModifiers InventoryRequestType="DirectAccess">
                <PermittedCabins>
                    <com:CabinClass Type="Business"/>
                </PermittedCabins>
            </AirPricingModifiers>
            {{else}}
            <AirPricingModifiers InventoryRequestType="DirectAccess"/>
            {{/if}}
            {{#passengers}}
            <com:SearchPassenger Key="PmWISQVVm02uvJ_{{@index}}" BookingTravelerRef="PmWISQVVm02uvJ_{{@index}}" Code="{{ageCategory}}" {{#if child}}Age="9"{{else if Age}}Age="{{Age}}"{{/if}} />
            {{/passengers}}
            <AirPricingCommand>
                {{#segments}}
                <AirSegmentPricingModifiers AirSegmentRef="{{{uapi_segment_ref}}}">
                {{#if bookingClass}}
                    <PermittedBookingCodes>
                            <BookingCode Code="{{bookingClass}}" />
                    </PermittedBookingCodes>
                {{/if}}
                </AirSegmentPricingModifiers>
                {{/segments}}
            </AirPricingCommand>
            {{#if emulatePcc}}
            <PCC>
                <OverridePCC ProviderCode="{{provider}}" PseudoCityCode="{{emulatePcc}}"/>
            </PCC>
            {{/if}}
            <com:FormOfPayment Type="Credit"/> 
        </AirPriceReq>
    </soap:Body>
</soap:Envelope>
`;
