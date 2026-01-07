import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { message } from 'antd';
import { SignUpForm, type SignUpValues } from '@web/src/components/auth/SignUpForm';
import { signUp } from '@web/src/lib/auth-client';
import { links } from '@web/src/constants/links';

export const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (values: SignUpValues) => {
        setLoading(true);
        try {
            await signUp.email({
                email: values.email,
                password: values.password,
                name: values.name,
            }, {
                onSuccess: () => {
                    message.success('Account created! Please check your email for verification.');
                    navigate(links.auth.emailVerificationPending, { state: { email: values.email } });
                },
                onError: (ctx) => {
                    message.error(ctx.error.message);
                }
            });
        } catch {
            message.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return <SignUpForm onSubmit={handleSignUp} isLoading={loading} />;
};
