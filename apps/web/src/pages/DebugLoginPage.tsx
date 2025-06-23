import { useState } from 'react';
import { Button, Card, Input, Typography, Space, Alert } from 'antd';
import { useLoginMutation } from '../features/auth/services/auth.service';
import { apiClient } from '@lib/api-client';
import { appConfig } from '@config/app.config';

const { Title, Text } = Typography;

/**
 * Debug Login Page to test authentication flow
 * This page will help us debug the "Cannot read properties of undefined (reading 'login')" error
 */
export const DebugLoginPage = () => {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('testpass');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const loginMutation = useLoginMutation({
    onSuccess: result => {
      setDebugInfo(prev => [
        ...prev,
        '✅ Login successful!',
        `Access token: ${result.accessToken.substring(0, 20)}...`,
      ]);
    },
    onError: error => {
      setDebugInfo(prev => [...prev, `❌ Login error: ${error.message}`]);
    },
  });

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testApiClientDirectly = () => {
    addDebugInfo('🔧 Testing API Client directly...');

    try {
      addDebugInfo(`Config check - API URL: ${appConfig.VITE_API_URL}`);
      addDebugInfo(`API Client exists: ${!!apiClient}`);
      addDebugInfo(`API Client.auth exists: ${!!apiClient?.auth}`);

      if (apiClient) {
        addDebugInfo(`API Client properties: ${Object.keys(apiClient).join(', ')}`);
      }

      if (apiClient?.auth) {
        addDebugInfo(
          `Auth API methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(apiClient.auth)).join(', ')}`,
        );
      }
    } catch (error) {
      addDebugInfo(`❌ Error testing API client: ${(error as Error).message}`);
    }
  };

  const testLoginDirectly = async () => {
    addDebugInfo('🔑 Testing login directly with API client...');

    try {
      if (!apiClient) {
        throw new Error('API client not available');
      }

      if (!apiClient.auth) {
        throw new Error('Auth API not available');
      }

      const result = await apiClient.auth.login({ username, password });
      addDebugInfo('✅ Direct login successful!');
      addDebugInfo(`Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      addDebugInfo(`❌ Direct login failed: ${(error as Error).message}`);
      addDebugInfo(`Error details: ${JSON.stringify(error, null, 2)}`);
    }
  };

  const testLoginMutation = () => {
    addDebugInfo('🎯 Testing login via mutation hook...');
    loginMutation.mutate({ username, password });
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>Debug Login Test</Title>
        <Text>This page will help us debug the authentication issue.</Text>

        <div style={{ marginTop: '20px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Username:</Text>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                style={{ marginLeft: '10px', width: '200px' }}
              />
            </div>

            <div>
              <Text strong>Password:</Text>
              <Input.Password
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ marginLeft: '10px', width: '200px' }}
              />
            </div>

            <Space wrap>
              <Button onClick={testApiClientDirectly}>1. Test API Client</Button>
              <Button onClick={testLoginDirectly}>2. Test Direct Login</Button>
              <Button type="primary" onClick={testLoginMutation} loading={loginMutation.isPending}>
                3. Test Login Mutation
              </Button>
              <Button onClick={clearDebugInfo}>Clear Debug</Button>
            </Space>
          </Space>
        </div>

        {debugInfo.length > 0 && (
          <Alert
            message="Debug Information"
            description={
              <div style={{ marginTop: '10px' }}>
                {debugInfo.map((info, index) => (
                  <div key={index} style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '5px' }}>
                    {info}
                  </div>
                ))}
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: '20px' }}
          />
        )}
      </Card>
    </div>
  );
};
