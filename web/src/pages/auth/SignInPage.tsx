import React from 'react';
import { useNavigate } from 'react-router';
import { message } from 'antd';
import { SignInForm, type SignInValues } from '@web/src/components/auth/SignInForm';
import { useSignIn } from '@web/src/hooks/auth/auth.hook';
import { links } from '@web/src/constants/links';

export const SignInPage: React.FC = () => {
    const navigate = useNavigate();
    const { mutate: signIn, isPending } = useSignIn();

    const handleSignIn = (values: SignInValues) => {
        signIn({
            email: values.email,
            password: values.password,
        }, {
            onSuccess: () => {
                message.success('Signed in successfully!');
                navigate(links.dashboard.profile);
            },
            onError: (error) => {
                message.error(error.message || "Failed to sign in");
            }
        });
    };

    return <SignInForm onSubmit={handleSignIn} isLoading={isPending} />;
};
