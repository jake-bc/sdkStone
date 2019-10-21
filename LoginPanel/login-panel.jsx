import React, { Fragment } from 'react';
import Alert from '../components/Alert/alert';
import EmailInput from '../components/EmailInput/email-input';
import PasswordInput from '../components/PasswordInput/password-input';
import styles from './login-panel.scss';
import Section from '../components/Section/section';
import CustomerSubmit from '../components/SubmitCustomer/submit-customer';
import { CheckoutService } from '@bigcommerce/checkout-sdk';
import Button from '../components/Button/button';


export default class LoginPanel extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            email: '',
            password: ''
        };
    }

    render() {
        return (
            <Section
                header={'Customer'}
                body={
                    <Fragment>
                          <div 
                        onClick={(event) => this._signIn(event)}>
                            {this.props.errors &&
                                <Alert body={this.props.errors.body.detail} />
                            }
                                <EmailInput
                                    id={'customerEmail'}
                                    label={'Email'}
                                    value={this.state.email}
                                    onChange={({ target }) => this.setState({ email: target.value })} />

                                <PasswordInput
                                    id={'customerPassword'}
                                    label={'Password'}
                                    value={this.state.password}
                                    onChange={({ target }) => this.setState({ password: target.value })} />          
                                    <div className={styles.actionContainer}>
                                <CustomerSubmit
                                    label={this.props.isSigningIn ? `Signing in as ${this.state.email}...` : 'Sign In'}
                                    isLoading={this.props.isSigningIn} />
                            </div>
                            <span>Don’t have an account? <a 
                            onSubmit={this.props.onClose}>Continue with guest checkout</a></span>

                     </div >
                    </Fragment>
                } />

        );
    }

    _signIn(event) {
        event.preventDefault();

        if (this.state.email && this.state.password) {
            return this.props.onClick(this.state).then(this.props.onClose);
        }
    }
}
