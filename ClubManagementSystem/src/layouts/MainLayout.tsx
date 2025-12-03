import { Outlet } from "react-router-dom";


const MainLayout = () => {
    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-700 flex flex-col">
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;