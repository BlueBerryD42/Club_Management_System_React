import { Layout } from "@/components/layout/Layout";

const UnauthorizedPage = () => {
    return (
        <Layout>
            <div className="container py-20">
                <h1 className="text-4xl font-bold">Unauthorized</h1>
                <p className="text-muted-foreground mt-4">
                    Bạn không có quyền truy cập trang này.
                </p>
            </div>
        </Layout>
    );
};

export default UnauthorizedPage;
