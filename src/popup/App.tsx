import './App.css'
import {useEffect, useState} from "react";

interface Candidate {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    passport_number: string;
    passport_expiry_date: string;
    passport_issue_date: string;
    passport_issue_place: string;
    email: string;
    gender: string;
    mobile_number: string;
    created_at: string;
    updated_at: string;
    status: string;
    date_of_birth: string;
    photo: string | null;
}


export default function App() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('http://localhost:3000/api/auth/session', {
            credentials: 'include',
        })
            .then(res => res.json())
            .then(session => {
                console.log('Session from NextAuth:', session);
                if (session?.user?.accessToken) {
                    return fetch('http://127.0.0.1:8000/api/candidates/candidates/', {
                        headers: {
                            Authorization: `Bearer ${session?.user?.accessToken}`,
                        },
                    });
                }
            })
            .then(res => res?.json())
            .then(data => {
                setCandidates(data?.results || []);
                console.log('Candidates:', data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <>

        </>
    );
}
