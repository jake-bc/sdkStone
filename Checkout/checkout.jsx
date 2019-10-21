import React, { Fragment } from 'react';
import { formatMoney } from 'accounting';
import { createCheckoutService } from '@bigcommerce/checkout-sdk';
import Panel from '../components/Panel/panel';
import SubmitButton from '../components/SubmitButton/submit-button';
import Billing from '../Billing/billing';
import Cart from '../Cart/cart';
import Customer from '../Customer/customer';
import LoginPanel from '../LoginPanel/login-panel';
import Payment from '../Payment/payment';
import Shipping from '../Shipping/shipping';
import Layout from './Layout/layout';
import LoadingState from './LoadingState/loading-state';
import styles from './checkout.scss';

export default class Checkout extends React.PureComponent {
    constructor(props) {
        super(props);

        this.service = createCheckoutService();

        this.state = {
            isPlacingOrder: false,
            showSignInPanel: false,
            customerId: ''
        };
    }

    componentDidMount() {
        Promise.all([
            this.service.loadCheckout(),
            this.service.loadShippingCountries(),
            this.service.loadShippingOptions(),
            this.service.loadBillingCountries(),
            this.service.loadPaymentMethods(),
        ]).then(() => {
            this.unsubscribe = this.service.subscribe((state) => {
                this.setState(state);
            });
        });
    }
    componentDidUpdate() {
        const { data, errors, statuses } = this.state;
        this.udpateCustomer()
        this.updateShipping()
    }

    udpateCustomer() {
        const filter = state => state.data.getCustomer();
        this.service.subscribe(state => {
            const customerId = state.data.getCustomer().id
                this.setState({customerId: customerId})
            console.log({showSignInPanel: this.state.showSignInPanel})
        }, filter);
    }

    updateShipping() {
        const filter = state => state.data.getShippingAddress();
        
        this.service.subscribe(state => {
            console.log({'Shipping Address': state.statuses.isUpdatingShippingAddress()})
        }, filter);
     
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        const { data, errors, statuses } = this.state;

        if (!data) {
            return (
                <Layout body={
                    <LoadingState />
                } />
            );
        }
        return (
            <Layout body={
                <Fragment>
                    <div className={ styles.body }>
                        <Panel body={
                            <form onSubmit={ (event) => this._submitOrder(event, data.getCustomer().isGuest) }>
                                {!this.state.showSignInPanel &&
                                <Customer
                                customer={ data.getCustomer() }
                                billingAddress={ data.getBillingAddress() }
                                isSigningOut={ statuses.isSigningOut() }
                                onClick={ async () => await this.service.signOutCustomer()
                                    .then(() => this.service.loadShippingOptions())
                                    .then((this.setState({ showSignInPanel: true })))
                                    .then((customer) => this.setState({ customer })) }
                                onChange={ (customer) => this.setState({ customer }) }
                                onSignIn={ () => this.setState({ showSignInPanel: true }) } />
                                }
                                 {this.state.showSignInPanel &&
                                    <LoginPanel
                                    customer={ data.getCustomer() }
                                    billingAddress={ data.getBillingAddress() }
                                        errors={ errors.getSignInError() }
                                        onChange={async () => await service.clearError(errore)}
                                        isSigningIn={ statuses.isSigningIn() }
                                        onClick={ async (customer) => await this.service.signInCustomer(customer)
                                            .then(() => this.setState({ showSignInPanel: false }))
                                        }
                                        onClose={ () => this.setState({ showSignInPanel: false }) } />
                                }
                                <Shipping
                                    customer={ data.getCustomer() }
                                    consignments={ data.getConsignments() }
                                    cart={ data.getCart() }
                                    isUpdatingConsignment={ statuses.isUpdatingConsignment }
                                    isCreatingConsignments={ statuses.isCreatingConsignments }
                                    isUpdatingShippingAddress={ statuses.isUpdatingShippingAddress }
                                    address={ data.getShippingAddress() }
                                    countries={ data.getShippingCountries() }
                                    options={ data.getShippingOptions() }
                                    selectedOptionId={ data.getSelectedShippingOption() ? data.getSelectedShippingOption().id : '' }
                                    isSelectingShippingOption ={ statuses.isSelectingShippingOption }
                                    onShippingOptionChange={ (optionId) => this.service.selectShippingOption(optionId) }
                                    onConsignmentUpdate={ (consignment) => (
                                        consignment.id ?
                                            this.service.updateConsignment(consignment) :
                                            this.service.createConsignments([consignment])
                                        )
                                    }
                                    onAddressChange={ (shippingAddress) => {
                                        this.setState({ shippingAddress })
                                        this.service.updateShippingAddress(shippingAddress)
                                    }} />

                                <Payment
                                    errors={ errors.getSubmitOrderError() }
                                    methods={ data.getPaymentMethods() }
                                    onClick={ (name, gateway) => this.service.initializePayment({ methodId: name, gatewayId: gateway }) }
                                    onChange={ (payment) => this.setState({ payment }) } />

                                <Billing
                                    multishipping={ (data.getConsignments() || []).length > 1 }
                                    address={ data.getBillingAddress() }
                                    countries={ data.getBillingCountries() }
                                    sameAsShippingAddress={
                                        (this.state.billingAddressSameAsShippingAddress === undefined) ||
                                        this.state.billingAddressSameAsShippingAddress
                                    }
                                    onChange ={ (billingAddress) => this.setState({ billingAddress }) }
                                    onSelect ={ (billingAddressSameAsShippingAddress) => this.setState({ billingAddressSameAsShippingAddress })  } />

                                <div className={ styles.actionContainer }>
                                    <SubmitButton
                                        label={ this._isPlacingOrder() ?
                                            'Placing your order...' :
                                            `Pay ${ formatMoney((data.getCheckout()).grandTotal) }`
                                        }
                                        isLoading={ this._isPlacingOrder() } />
                                </div>
                            </form>
                        } />
                    </div>

                    <div className={ styles.side }>
                        <Cart
                            checkout={ data.getCheckout() }
                            cartLink={ (data.getConfig()).links.cartLink } />
                    </div>
                </Fragment>
            } />
        );
    }

    _isPlacingOrder() {
        const { statuses } = this.state;

        return this.state.isPlacingOrder && (
            statuses.isSigningIn() ||
            statuses.isUpdatingShippingAddress() ||
            statuses.isUpdatingBillingAddress() ||
            statuses.isSubmittingOrder()
        );
    }

    _submitOrder(event, isGuest) {
        let billingAddressPayload = this.state.billingAddressSameAsShippingAddress ?
            this.state.shippingAddress :
            this.state.billingAddress;

        billingAddressPayload = { ...billingAddressPayload, email: this.state.customer.email };

        let { payment } = this.state;

        this.setState({ isPlacingOrder: true });
        event.preventDefault();

        Promise.all([
            isGuest ? this.service.continueAsGuest(this.state.customer) : Promise.resolve(),
            this.service.updateBillingAddress(billingAddressPayload),
        ])
            .then(() => this.service.submitOrder({ payment }))
            .then(({ data }) => {
                window.location.href = data.getConfig().links.orderConfirmationLink;
            })
            .catch(() => this.setState({ isPlacingOrder: false }));
    }
}
