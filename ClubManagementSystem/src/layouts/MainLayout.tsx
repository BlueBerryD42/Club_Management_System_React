import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <ScrollToTop />
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;