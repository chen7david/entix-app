import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { message } from 'antd';
import { SignInForm, type SignInValues } from '@web/src/components/auth/SignInForm';
import { signIn } from '@web/src/lib/auth-client';
import { links } from '@web/src/constants/links';

export const SignInPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (values: SignInValues) => {
        setLoading(true);
        try {
            await signIn.email({
                email: values.email,
                password: values.password,
            }, {
                onSuccess: () => {
                    message.success('Signed in successfully!');
                    navigate(links.dashboard.profile);
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

    return <SignInForm onSubmit={handleSignIn} isLoading={loading} />;
};
