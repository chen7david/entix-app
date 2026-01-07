import React from 'react';
import { useNavigate } from 'react-router';
import { message } from 'antd';
import { SignUpForm, type SignUpValues } from '@web/src/components/auth/SignUpForm';
import { useSignUp } from '@web/src/hooks/auth/auth.hook';
import { links } from '@web/src/constants/links';

export const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const { mutate: signUp, isPending } = useSignUp();

    const handleSignUp = (values: SignUpValues) => {
        signUp({
            email: values.email,
            password: values.password,
            name: values.name,
        }, {
            onSuccess: () => {
                message.success('Account created! Please check your email for verification.');
                navigate(links.auth.emailVerificationPending, { state: { email: values.email } });
            },
            onError: (error) => {
                message.error(error.message || "Failed to create account");
            }
        });
    };

    return <SignUpForm onSubmit={handleSignUp} isLoading={isPending} />;
};
