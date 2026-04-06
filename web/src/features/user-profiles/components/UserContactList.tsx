import {
    DeleteOutlined,
    EditOutlined,
    HomeOutlined,
    LinkOutlined,
    PhoneOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { useSocialMediaTypes, useUserProfile } from "@web/src/features/user-profiles";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import {
    AutoComplete,
    Button,
    Card,
    Drawer,
    Form,
    Input,
    List,
    message,
    Popconfirm,
    Select,
    Spin,
    Switch,
    Tag,
    Typography,
} from "antd";
import { City, Country, State } from "country-state-city";
import { AsYouType, type CountryCode } from "libphonenumber-js";
import { useState } from "react";

export const UserContactList = ({
    userId,
    hideSocial,
    hideCopy,
}: {
    userId: string;
    hideSocial?: boolean;
    hideCopy?: boolean;
}) => {
    const {
        aggregate,
        isLoading,
        addPhone,
        updatePhone,
        deletePhone,
        addAddress,
        updateAddress,
        deleteAddress,
        addSocial,
        updateSocial,
        deleteSocial,
    } = useUserProfile(userId);

    const { socialMediaTypes } = useSocialMediaTypes();

    const [phoneForm] = Form.useForm();
    const [addressForm] = Form.useForm();
    const [socialForm] = Form.useForm();

    const [phoneModalState, setPhoneModalState] = useState<{ isOpen: boolean; editId?: string }>({
        isOpen: false,
    });
    const [addressModalState, setAddressModalState] = useState<{
        isOpen: boolean;
        editId?: string;
    }>({ isOpen: false });
    const [socialModalState, setSocialModalState] = useState<{ isOpen: boolean; editId?: string }>({
        isOpen: false,
    });

    const handlePhoneSubmit = async (values: any) => {
        try {
            const payload = { ...values };
            if (payload.label === "Custom") {
                payload.label = payload.customLabel;
            }
            delete payload.customLabel;

            if (phoneModalState.editId) {
                await updatePhone.mutateAsync({ id: phoneModalState.editId, payload });
                message.success("Phone updated successfully");
            } else {
                await addPhone.mutateAsync(payload);
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
            let labelValue = p.label;
            let customLabelValue = "";
            if (!["Mobile", "Home", "Work"].includes(p.label)) {
                labelValue = "Custom";
                customLabelValue = p.label;
            }
            phoneForm.setFieldsValue({ ...p, label: labelValue, customLabel: customLabelValue });
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

    const phoneLabelWatch = Form.useWatch("label", phoneForm);
    const addressCountryWatch = Form.useWatch("country", addressForm);
    const addressStateWatch = Form.useWatch("state", addressForm);

    const getIsoCodeFromName = (name: string) =>
        Country.getAllCountries().find((c) => c.name === name || c.isoCode === name)?.isoCode || "";
    const addressCountryIso = getIsoCodeFromName(addressCountryWatch);

    const statesData = addressCountryIso ? State.getStatesOfCountry(addressCountryIso) : [];
    const states = statesData.map((s) => ({ value: s.name }));

    const addressStateIso = statesData.find((s) => s.name === addressStateWatch)?.isoCode || "";
    const cities =
        addressCountryIso && addressStateIso
            ? City.getCitiesOfState(addressCountryIso, addressStateIso).map((c) => ({
                  value: c.name,
              }))
            : [];

    if (isLoading)
        return (
            <div className="p-4 flex justify-center">
                <Spin />
            </div>
        );

    const phones = aggregate?.phones || [];
    const addresses = aggregate?.addresses || [];

    return (
        <div className="flex flex-col gap-6">
            {/* Phones List */}
            <Card
                title="Phone Numbers"
                size="small"
                className="shadow-sm border-gray-200 dark:border-gray-800"
                extra={
                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => openPhoneModal()}
                    >
                        Add
                    </Button>
                }
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
                                        <div className="flex items-center gap-2 flex-wrap w-full">
                                            <Typography.Text
                                                copyable={!hideCopy}
                                                className="font-medium"
                                            >
                                                {`${p.countryCode} ${p.number} ${p.extension ? `x${p.extension}` : ""}`}
                                            </Typography.Text>
                                            <Typography.Text type="secondary" className="text-xs">
                                                {p.label}
                                            </Typography.Text>
                                            {p.isPrimary && (
                                                <Tag
                                                    color="blue"
                                                    className="text-[10px] leading-tight px-1 m-0"
                                                >
                                                    Primary
                                                </Tag>
                                            )}
                                        </div>
                                    }
                                />
                            </div>
                            <div className="w-[20%] flex justify-end gap-1">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => openPhoneModal(p)}
                                />
                                <Popconfirm
                                    title="Delete?"
                                    onConfirm={() => deletePhone.mutateAsync(p.id)}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        loading={deletePhone.isPending}
                                    />
                                </Popconfirm>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>

            <Drawer
                title={phoneModalState.editId ? "Edit Phone" : "Add Phone"}
                placement="right"
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                open={phoneModalState.isOpen}
                onClose={() => setPhoneModalState({ isOpen: false })}
                destroyOnClose
                push={false}
                extra={
                    <Button
                        type="primary"
                        onClick={() => phoneForm.submit()}
                        loading={addPhone.isPending || updatePhone.isPending}
                    >
                        Save
                    </Button>
                }
            >
                <Form form={phoneForm} layout="vertical" onFinish={handlePhoneSubmit}>
                    <Form.Item
                        name="countryCode"
                        label="Country Code"
                        rules={[{ required: true }]}
                        initialValue="+1"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="number" label="Number" rules={[{ required: true }]}>
                        <Input
                            onChange={(e) => {
                                // Extract possible 2-letter country code or default to US
                                const parsedCountry =
                                    phoneForm.getFieldValue("countryCode") === "+1"
                                        ? "US"
                                        : undefined;
                                const formatted = new AsYouType(parsedCountry as CountryCode).input(
                                    e.target.value
                                );
                                phoneForm.setFieldValue("number", formatted);
                            }}
                        />
                    </Form.Item>
                    <Form.Item name="extension" label="Extension">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="label"
                        label="Label"
                        rules={[{ required: true }]}
                        initialValue="Mobile"
                    >
                        <Select
                            options={[
                                { label: "Mobile", value: "Mobile" },
                                { label: "Home", value: "Home" },
                                { label: "Work", value: "Work" },
                                { label: "Custom", value: "Custom" },
                            ]}
                        />
                    </Form.Item>
                    {phoneLabelWatch === "Custom" && (
                        <Form.Item
                            name="customLabel"
                            label="Custom Label"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="Enter custom label" />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="isPrimary"
                        label="Primary Identity"
                        valuePropName="checked"
                        initialValue={false}
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Drawer>

            {/* Addresses List */}
            <Card
                title="Addresses"
                size="small"
                className="shadow-sm border-gray-200 dark:border-gray-800"
                extra={
                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => openAddressModal()}
                    >
                        Add
                    </Button>
                }
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
                                            copyable={
                                                !hideCopy
                                                    ? {
                                                          text: `${a.address}, ${a.city}, ${a.state} ${a.zip} - ${a.country}`,
                                                      }
                                                    : false
                                            }
                                            ellipsis={{
                                                tooltip: `${a.address}, ${a.city}, ${a.state} ${a.zip} - ${a.country}`,
                                            }}
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
                                                {a.label}{" "}
                                                {a.isPrimary && (
                                                    <Tag
                                                        color="blue"
                                                        className="ml-2 text-[10px] leading-tight px-1"
                                                    >
                                                        Primary
                                                    </Tag>
                                                )}
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                            <div className="w-[20%] flex justify-end gap-1">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => openAddressModal(a)}
                                />
                                <Popconfirm
                                    title="Delete?"
                                    onConfirm={() => deleteAddress.mutateAsync(a.id)}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        loading={deleteAddress.isPending}
                                    />
                                </Popconfirm>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>

            <Drawer
                title={addressModalState.editId ? "Edit Address" : "Add Address"}
                placement="right"
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                open={addressModalState.isOpen}
                onClose={() => setAddressModalState({ isOpen: false })}
                destroyOnClose
                push={false}
                extra={
                    <Button
                        type="primary"
                        onClick={() => addressForm.submit()}
                        loading={addAddress.isPending || updateAddress.isPending}
                    >
                        Save
                    </Button>
                }
            >
                <Form form={addressForm} layout="vertical" onFinish={handleAddressSubmit}>
                    <Form.Item
                        name="country"
                        label="Country"
                        rules={[{ required: true }]}
                        initialValue="United States"
                    >
                        <Select
                            showSearch
                            options={Country.getAllCountries().map((c) => ({
                                label: c.name,
                                value: c.name,
                            }))}
                            filterOption={(input, option) =>
                                (option?.label as string)
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>
                    <Form.Item name="state" label="State / Province" rules={[{ required: true }]}>
                        <AutoComplete
                            options={states}
                            filterOption={(inputValue, option) =>
                                (option?.value || "")
                                    .toUpperCase()
                                    .indexOf(inputValue.toUpperCase()) !== -1
                            }
                            placeholder="Select or enter state/province"
                        />
                    </Form.Item>
                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                        <AutoComplete
                            options={cities}
                            filterOption={(inputValue, option) =>
                                (option?.value || "")
                                    .toUpperCase()
                                    .indexOf(inputValue.toUpperCase()) !== -1
                            }
                            placeholder="Select or enter city"
                        />
                    </Form.Item>
                    <Form.Item name="zip" label="Zip" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Street Address" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="label"
                        label="Label"
                        rules={[{ required: true }]}
                        initialValue="Home"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="isPrimary"
                        label="Primary Identity"
                        valuePropName="checked"
                        initialValue={false}
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Drawer>

            {/* Social Media List */}
            {!hideSocial && (
                <Card
                    title="Social Media Identities"
                    size="small"
                    className="shadow-sm border-gray-200 dark:border-gray-800"
                    extra={
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            size="small"
                            onClick={() => openSocialModal()}
                        >
                            Bind
                        </Button>
                    }
                >
                    <List
                        size="small"
                        dataSource={aggregate?.socialMedias || []}
                        renderItem={(s: any) => (
                            <List.Item className="flex items-start">
                                <div className="w-[80%] pr-2 min-w-0">
                                    <List.Item.Meta
                                        avatar={<LinkOutlined className="text-gray-400 mt-1" />}
                                        title={
                                            <span className="font-medium block w-full">
                                                {s.socialMediaType?.name}
                                            </span>
                                        }
                                        description={
                                            <Typography.Text
                                                copyable={!hideCopy}
                                                ellipsis={{ tooltip: true }}
                                                className="block w-full"
                                            >
                                                {s.urlOrHandle}
                                            </Typography.Text>
                                        }
                                    />
                                </div>
                                <div className="w-[20%] flex justify-end gap-1">
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => openSocialModal(s)}
                                    />
                                    <Popconfirm
                                        title="Delete?"
                                        onConfirm={() => deleteSocial.mutateAsync(s.id)}
                                    >
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            loading={deleteSocial.isPending}
                                        />
                                    </Popconfirm>
                                </div>
                            </List.Item>
                        )}
                    />
                </Card>
            )}

            <Drawer
                title={socialModalState.editId ? "Update Identity" : "Bind Social Account"}
                placement="right"
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                open={socialModalState.isOpen}
                onClose={() => setSocialModalState({ isOpen: false })}
                destroyOnClose
                push={false}
                extra={
                    <Button
                        type="primary"
                        onClick={() => socialForm.submit()}
                        loading={addSocial.isPending || updateSocial.isPending}
                    >
                        Save
                    </Button>
                }
            >
                <Form form={socialForm} layout="vertical" onFinish={handleSocialSubmit}>
                    <Form.Item
                        name="socialMediaTypeId"
                        label="Social Platform"
                        rules={[{ required: true }]}
                    >
                        <Select placeholder="Select Platform">
                            {(socialMediaTypes || []).map((t: any) => (
                                <Select.Option key={t.id} value={t.id}>
                                    {t.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="urlOrHandle"
                        label="URL or Handle"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
};
