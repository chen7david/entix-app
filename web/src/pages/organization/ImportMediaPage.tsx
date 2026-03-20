import React, { useState } from 'react';
import { Typography, Input, Card, Button, Form, Select, Spin, message, Space, Tag } from 'antd';
import { CloudDownloadOutlined, SearchOutlined, YoutubeOutlined, FileImageOutlined } from '@ant-design/icons';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';

const { Title, Text } = Typography;

export const ImportMediaPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [url, setUrl] = useState<string>('');

    const analyzeMutation = useMutation({
        mutationFn: async (youtubeUrl: string) => {
            const res = await fetch(`/api/v1/orgs/${activeOrganization?.id}/media/imports/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: youtubeUrl })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Analysis failed");
            }
            return res.json();
        }
    });

    const executeMutation = useMutation({
        mutationFn: async (payload: { url: string, formatItag: number, metadata: any }) => {
            const res = await fetch(`/api/v1/orgs/${activeOrganization?.id}/media/imports/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Import failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["media", activeOrganization?.id] });
            message.success("Video successfully imported from YouTube edge cache!");
            // Default forward them to the Video Library
            navigate(`/org/${activeOrganization?.slug}/video`);
        },
        onError: (err: Error) => {
            message.error(err.message);
        }
    });

    const onAnalyze = (value: string) => {
        if (!value) return;
        setUrl(value);
        analyzeMutation.mutate(value);
    };

    const handleImportSubmit = (values: any) => {
        executeMutation.mutate({
            url: url,
            formatItag: values.formatItag,
            metadata: analyzeMutation.data // pass the cached manifest back up to save CPU cycles
        });
    };

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="!mb-1">Import Media</Title>
                        <Text type="secondary" className="text-base">
                            Paste a verified YouTube URL to instantly bypass the queue and stream into the Cloudflare Edge network.
                        </Text>
                    </div>
                </div>

                <div className="h-full relative max-w-4xl">
                <Spin 
                    spinning={executeMutation.isPending} 
                    tip={
                        <div className="mt-4">
                            <div className="text-lg font-bold">Synchronous Edge Stream Initiated</div>
                            <div className="text-gray-500 max-w-sm mt-2">Piping YouTube blocks directly into Cloudflare R2 object storage. <br/><b>Please do not close this window</b> until the stream seals.</div>
                        </div>
                    } 
                    size="large"
                >
                    <Card className="shadow-sm border-gray-100 mb-8 p-4">
                        <Input.Search
                            placeholder="https://www.youtube.com/watch?v=..."
                            allowClear
                            enterButton={<Button type="primary" icon={<SearchOutlined />} loading={analyzeMutation.isPending}>Analyze Link</Button>}
                            size="large"
                            onSearch={onAnalyze}
                            className="max-w-3xl"
                        />
                    </Card>

                    {analyzeMutation.data && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in fade-in">
                            <div className="col-span-1">
                                {analyzeMutation.data.coverArtUrl ? (
                                    <div className="rounded-xl overflow-hidden shadow-md group relative aspect-video bg-gray-900 border border-gray-200">
                                        <img src={analyzeMutation.data.coverArtUrl} alt="Video Cover" className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105" />
                                    </div>
                                ) : (
                                    <div className="rounded-lg shadow-sm w-full aspect-video bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                                        <FileImageOutlined className="text-4xl text-gray-300" />
                                    </div>
                                )}
                            </div>

                            <div className="col-span-2 space-y-4">
                                <div>
                                    <Space size="middle" className="mb-2">
                                        <Tag icon={<YoutubeOutlined />} color="red">YouTube Network</Tag>
                                        <Text type="secondary">{analyzeMutation.data.channelName}</Text>
                                    </Space>
                                    <Title level={4} className="!mt-0 !mb-2 line-clamp-2">{analyzeMutation.data.title}</Title>
                                    <Text type="secondary" className="line-clamp-3 text-sm">
                                        {analyzeMutation.data.description}
                                    </Text>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mt-6">
                                    <Form form={form} layout="vertical" onFinish={handleImportSubmit}>
                                        <Form.Item 
                                            name="formatItag" 
                                            label={<span className="font-semibold text-gray-700">Select Extraction Profile</span>} 
                                            rules={[{ required: true, message: 'Please select a formatting profile' }]}
                                        >
                                            <Select size="large" placeholder="Select highest fidelity video or pure audio format...">
                                                <Select.OptGroup label="Video Outputs (MP4)">
                                                    {analyzeMutation.data.formats
                                                        .filter((f: any) => f.hasVideo && f.qualityLabel)
                                                        .map((f: any) => (
                                                            <Select.Option key={f.itag} value={f.itag}>
                                                                <div className="flex justify-between w-full">
                                                                    <span>{f.qualityLabel} Video {f.hasAudio ? '+ Audio' : '(No Audio)'} • {f.container.toUpperCase()}</span>
                                                                    <span className="text-gray-400 text-xs">{(Number(f.contentLength) / 1024 / 1024).toFixed(1)} MB</span>
                                                                </div>
                                                            </Select.Option>
                                                        ))}
                                                </Select.OptGroup>
                                                <Select.OptGroup label="Audio Outputs (MP3/M4A)">
                                                    {analyzeMutation.data.formats
                                                        .filter((f: any) => !f.hasVideo && f.hasAudio && f.audioBitrate)
                                                        .map((f: any) => (
                                                            <Select.Option key={f.itag} value={f.itag}>
                                                                <div className="flex justify-between w-full">
                                                                    <span>Audio Track ({f.audioBitrate} kbps) • {f.container.toUpperCase()}</span>
                                                                    <span className="text-gray-400 text-xs">{(Number(f.contentLength) / 1024 / 1024).toFixed(1)} MB</span>
                                                                </div>
                                                            </Select.Option>
                                                        ))}
                                                </Select.OptGroup>
                                            </Select>
                                        </Form.Item>
                                        
                                        <div className="flex justify-end pt-2">
                                            <Button size="large" type="primary" htmlType="submit" icon={<CloudDownloadOutlined />} loading={executeMutation.isPending} className="px-8 shadow-sm">
                                                Commence Edge Stream
                                            </Button>
                                        </div>
                                    </Form>
                                </div>
                            </div>
                        </div>
                    )}
                </Spin>
                </div>
            </div>
        </>
    );
};
