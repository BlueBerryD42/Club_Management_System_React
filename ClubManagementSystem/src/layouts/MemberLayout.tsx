import { Outlet } from "react-router-dom";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const MemberLayout = () => {
    return (
        <>
            <ScrollToTop />
            <Outlet />
        </>
    );
};

export default MemberLayout;
