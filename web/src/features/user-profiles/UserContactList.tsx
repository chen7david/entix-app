import { useState } from "react";
import { Form, Input, Select, Button, message, List, Card, Tag, Popconfirm, Drawer, Space, Spin, Typography } from "antd";
import { useUserProfile } from "@web/src/hooks/api/user-profiles.hooks";
import { useSocialMediaTypes } from "@web/src/hooks/api/social-media.hooks";
import { PhoneOutlined, HomeOutlined, DeleteOutlined, LinkOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

export const UserContactList = ({ userId, hideSocial, hideCopy }: { userId: string, hideSocial?: boolean, hideCopy?: boolean }) => {
    const { 
        aggregate, isLoading, 
        addPhone, updatePhone, deletePhone, 
        addAddress, updateAddress, deleteAddress, 
        addSocial, updateSocial, deleteSocial 
    } = useUserProfile(userId);
    
    const { socialMediaTypes } = useSocialMediaTypes();

    const [phoneForm] = Form.useForm();
    const [addressForm] = Form.useForm();
    const [socialForm] = Form.useForm();

    const [phoneModalState, setPhoneModalState] = useState<{ isOpen: boolean; editId?: string }>({ isOpen: false });
    const [addressModalState, setAddressModalState] = useState<{ isOpen: boolean; editId?: string }>({ isOpen: false });
    const [socialModalState, setSocialModalState] = useState<{ isOpen: boolean; editId?: string }>({ isOpen: false });

    const handlePhoneSubmit = async (values: any) => {
        try {
            if (phoneModalState.editId) {
                await updatePhone.mutateAsync({ id: phoneModalState.editId, payload: values });
                message.success("Phone updated successfully");
            } else {
                await addPhone.mutateAsync(values);
                message.success("Phone added successfully");
            }
            setPhoneModalState({ isOpen: false });
            phoneForm.resetFields();
        } catch {
            message.error("Failed to process phone entry");
        }
    };

    const handleAddressSubmit = async (values: any) => {
        try {
            if (addressModalState.editId) {
                await updateAddress.mutateAsync({ id: addressModalState.editId, payload: values });
                message.success("Address updated successfully");
            } else {
                await addAddress.mutateAsync(values);
                message.success("Address added successfully");
            }
            setAddressModalState({ isOpen: false });
            addressForm.resetFields();
        } catch {
            message.error("Failed to process address");
        }
    };

    const handleSocialSubmit = async (values: any) => {
        try {
            if (socialModalState.editId) {
                await updateSocial.mutateAsync({ id: socialModalState.editId, payload: values });
                message.success("Social Medias updated successfully");
            } else {
                await addSocial.mutateAsync(values);
                message.success("Social Medias appended successfully");
            }
            setSocialModalState({ isOpen: false });
            socialForm.resetFields();
        } catch {
            message.error("Failed to manage social media mappings");
        }
    };

    const openPhoneModal = (p?: any) => {
        if (p) {
            phoneForm.setFieldsValue(p);
            setPhoneModalState({ isOpen: true, editId: p.id });
        } else {
            phoneForm.resetFields();
            setPhoneModalState({ isOpen: true });
        }
    };

    const openAddressModal = (a?: any) => {
        if (a) {
            addressForm.setFieldsValue(a);
            setAddressModalState({ isOpen: true, editId: a.id });
        } else {
            addressForm.resetFields();
            setAddressModalState({ isOpen: true });
        }
    };

    const openSocialModal = (s?: any) => {
        if (s) {
            socialForm.setFieldsValue(s);
            setSocialModalState({ isOpen: true, editId: s.id });
        } else {
            socialForm.resetFields();
            setSocialModalState({ isOpen: true });
        }
    };

    if (isLoading) return <div className="p-4 flex justify-center"><Spin /></div>;

    const phones = aggregate?.phoneNumbers || [];
    const addresses = aggregate?.addresses || [];

    return (
        <div className="flex flex-col gap-6">
            {/* Phones List */}
            <Card 
                title="Phone Numbers" 
                size="small" 
                className="shadow-sm border-gray-200 dark:border-gray-800"
                extra={<Button type="dashed" icon={<PlusOutlined />} size="small" onClick={() => openPhoneModal()}>Add</Button>}
            >
                <List
                    size="small"
                    dataSource={phones}
                    renderItem={(p: any) => (
                        <List.Item className="flex items-start">
                            <div className="w-[80%] pr-2 min-w-0">
                                <List.Item.Meta
                                    avatar={<PhoneOutlined className="text-gray-400 mt-1" />}
                                    title={
                                        <Typography.Text copyable={!hideCopy} ellipsis={{ tooltip: true }} className="font-medium block w-full">
                                            {`${p.countryCode} ${p.number} ${p.extension ? `x${p.extension}` : ''}`}
                                        </Typography.Text>
                                    }
                                    description={
                                        <div>
                                            <Typography.Text type="secondary" ellipsis={{ tooltip: true }} className="w-full">
                                                {p.label}
                                            </Typography.Text>
                                            {p.isPrimary && <Tag color="blue" className="ml-1 text-[10px] leading-tight px-1">Primary</Tag>}
                                        </div>
                                    }
                                />
                            </div>
                            <div className="w-[20%] flex justify-end gap-1">
                                <Button type="text" icon={<EditOutlined />} onClick={() => openPhoneModal(p)} />
                                <Popconfirm title="Delete?" onConfirm={() => deletePhone.mutateAsync(p.id)}>
                                    <Button type="text" danger icon={<DeleteOutlined />} loading={deletePhone.isPending} />
                                </Popconfirm>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>

            <Drawer title={phoneModalState.editId ? "Edit Phone" : "Add Phone"} placement="right" width={400} open={phoneModalState.isOpen} onClose={() => setPhoneModalState({ isOpen: false })} destroyOnClose>
                <Form form={phoneForm} layout="vertical" onFinish={handlePhoneSubmit}>
                    <Form.Item name="countryCode" label="Country Code" rules={[{ required: true }]} initialValue="+1"><Input /></Form.Item>
                    <Form.Item name="number" label="Number" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="extension" label="Extension"><Input /></Form.Item>
                    <Form.Item name="label" label="Label" rules={[{ required: true }]} initialValue="Mobile"><Input /></Form.Item>
                    <Form.Item name="isPrimary" label="Primary Identity" initialValue={false}>
                        <Select options={[{label: 'Primary', value: true}, {label: 'Secondary', value: false}]} />
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setPhoneModalState({ isOpen: false })}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={addPhone.isPending || updatePhone.isPending}>Save</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Drawer>

            {/* Addresses List */}
            <Card 
                title="Addresses" 
                size="small" 
                className="shadow-sm border-gray-200 dark:border-gray-800"
                extra={<Button type="dashed" icon={<PlusOutlined />} size="small" onClick={() => openAddressModal()}>Add</Button>}
            >
                <List
                    size="small"
                    dataSource={addresses}
                    renderItem={(a: any) => (
                        <List.Item className="flex items-start">
                            <div className="w-[80%] pr-2 min-w-0">
                                <List.Item.Meta
                                    avatar={<HomeOutlined className="text-gray-400 mt-1" />}
                                    title={
                                        <Typography.Text 
                                            copyable={!hideCopy ? { text: `${a.address}, ${a.city}, ${a.state} ${a.zip} - ${a.country}` } : false} 
                                            ellipsis={{ tooltip: `${a.address}, ${a.city}, ${a.state} ${a.zip} - ${a.country}` }} 
                                            className="font-medium block w-full"
                                        >
                                            {a.address}
                                        </Typography.Text>
                                    }
                                    description={
                                        <div className="flex flex-col">
                                            <div className="w-full truncate text-gray-500">
                                                {a.city}, {a.state} {a.zip} - {a.country}
                                            </div>
                                            <div className="mt-1">
                                                {a.label} {a.isPrimary && <Tag color="blue" className="ml-2 text-[10px] leading-tight px-1">Primary</Tag>}
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                            <div className="w-[20%] flex justify-end gap-1">
                                <Button type="text" icon={<EditOutlined />} onClick={() => openAddressModal(a)} />
                                <Popconfirm title="Delete?" onConfirm={() => deleteAddress.mutateAsync(a.id)}>
                                    <Button type="text" danger icon={<DeleteOutlined />} loading={deleteAddress.isPending} />
                                </Popconfirm>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>

            <Drawer title={addressModalState.editId ? "Edit Address" : "Add Address"} placement="right" width={400} open={addressModalState.isOpen} onClose={() => setAddressModalState({ isOpen: false })} destroyOnClose>
                <Form form={addressForm} layout="vertical" onFinish={handleAddressSubmit}>
                    <Form.Item name="country" label="Country" rules={[{ required: true }]} initialValue="USA"><Input /></Form.Item>
                    <Form.Item name="state" label="State" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="zip" label="Zip" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="address" label="Street Address" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="label" label="Label" rules={[{ required: true }]} initialValue="Home"><Input /></Form.Item>
                    <Form.Item name="isPrimary" label="Primary Config" initialValue={false}>
                        <Select options={[{label: 'Primary', value: true}, {label: 'Secondary', value: false}]} />
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setAddressModalState({ isOpen: false })}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={addAddress.isPending || updateAddress.isPending}>Save</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Drawer>

            {/* Social Media List */}
            {!hideSocial && (
            <Card 
                title="Social Media Identities" 
                size="small" 
                className="shadow-sm border-gray-200 dark:border-gray-800"
                extra={<Button type="dashed" icon={<PlusOutlined />} size="small" onClick={() => openSocialModal()}>Bind</Button>}
            >
                <List
                    size="small"
                    dataSource={aggregate?.socialMedias || []}
                    renderItem={(s: any) => (
                        <List.Item className="flex items-start">
                            <div className="w-[80%] pr-2 min-w-0">
                                <List.Item.Meta
                                    avatar={<LinkOutlined className="text-gray-400 mt-1" />}
                                    title={<span className="font-medium block w-full">{s.socialMediaType?.name}</span>}
                                    description={
                                        <Typography.Text copyable={!hideCopy} ellipsis={{ tooltip: true }} className="block w-full">
                                            {s.urlOrHandle}
                                        </Typography.Text>
                                    }
                                />
                            </div>
                            <div className="w-[20%] flex justify-end gap-1">
                                <Button type="text" icon={<EditOutlined />} onClick={() => openSocialModal(s)} />
                                <Popconfirm title="Delete?" onConfirm={() => deleteSocial.mutateAsync(s.id)}>
                                    <Button type="text" danger icon={<DeleteOutlined />} loading={deleteSocial.isPending} />
                                </Popconfirm>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>

            )}

            <Drawer title={socialModalState.editId ? "Update Identity" : "Bind Social Account"} placement="right" width={400} open={socialModalState.isOpen} onClose={() => setSocialModalState({ isOpen: false })} destroyOnClose>
                <Form form={socialForm} layout="vertical" onFinish={handleSocialSubmit}>
                    <Form.Item name="socialMediaTypeId" label="Social Platform" rules={[{ required: true }]}>
                        <Select placeholder="Select Platform">
                            {(socialMediaTypes || []).map((t: any) => (
                                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="urlOrHandle" label="URL or Handle" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setSocialModalState({ isOpen: false })}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={addSocial.isPending || updateSocial.isPending}>Save</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Drawer>

        </div>
    );
};
