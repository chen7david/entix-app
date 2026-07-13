import { Breadcrumb } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import type React from "react";
import { Link } from "react-router";

export type PageBreadcrumbItem = {
    title: React.ReactNode;
    path?: string;
};

type PageBreadcrumbProps = {
    items: PageBreadcrumbItem[];
    className?: string;
};

/**
 * Shared breadcrumb for deep org routes (lesson / session / import / playlist).
 */
export function PageBreadcrumb({ items, className = "mb-4" }: PageBreadcrumbProps) {
    const antdItems: ItemType[] = items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (!item.path || isLast) {
            return { title: item.title };
        }
        return {
            title: <Link to={item.path}>{item.title}</Link>,
        };
    });

    return <Breadcrumb className={className} items={antdItems} />;
}
