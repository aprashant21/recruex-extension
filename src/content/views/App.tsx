"use client"
import Logo from '@/assets/crx.svg'
import { useEffect, useState } from 'react'
import './App.css'

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

function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [filling, setFilling] = useState(false);

    useEffect(() => {
        chrome.runtime.onMessage.addListener((request) => {
            console.log('Content script received message:', request);

            if (request.type === 'FILL_FORM') {
                const candidate: Candidate = request?.payload;
                setCandidates(candidate);
            }
        });
    }, []);

    const getInitials = (firstName: string, lastName: string): string => {
        const first = firstName ? firstName.charAt(0).toUpperCase() : '';
        const last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return first + last;
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const capitalizeFirst = (str: string): string => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const fillForm = async (candidate: Candidate) => {
        setSelectedId(candidate.id);
        setFilling(true);

        try {
            const fieldMappings: Record<string, string[]> = {
                first_name: ['first_name', 'firstname', 'first-name', 'firstName', 'fname', 'given_name', 'givenname'],
                middle_name: ['middle_name', 'middlename', 'middle-name', 'middleName', 'mname'],
                last_name: ['last_name', 'lastname', 'last-name', 'lastName', 'lname', 'surname', 'family_name', 'familyname'],
                passport_number: ['passport_number', 'passportnumber', 'passport-number', 'passportNumber', 'passport_no', 'passport', 'passportno'],
                passport_expiry_date: ['passport_expiry_date', 'passportexpirydate', 'passport-expiry-date', 'passportExpiryDate', 'expiry_date', 'expirydate', 'passport_expiry', 'expiry'],
                passport_issue_date: ['passport_issue_date', 'passportissuedate', 'passport-issue-date', 'passportIssueDate', 'issue_date', 'issuedate', 'passport_issue'],
                passport_issue_place: ['passport_issue_place', 'passportissueplace', 'passport-issue-place', 'passportIssuePlace', 'issue_place', 'issueplace', 'place_of_issue', 'placeofissue'],
                email: ['email', 'email_address', 'emailaddress', 'e-mail', 'mail', 'email_id'],
                gender: ['gender', 'sex'],
                mobile_number: ['mobile_number', 'mobilenumber', 'mobile-number', 'mobileNumber', 'mobile', 'phone', 'phone_number', 'phonenumber', 'contact', 'contact_number', 'telephone', 'tel'],
                date_of_birth: ['date_of_birth', 'dateofbirth', 'date-of-birth', 'dateOfBirth', 'dob', 'birth_date', 'birthdate', 'birthday']
            };

            let fieldsFound = 0;

            for (const [dataKey, value] of Object.entries(candidate)) {
                if (
                    !value ||
                    dataKey === 'id' ||
                    dataKey === 'created_at' ||
                    dataKey === 'updated_at' ||
                    dataKey === 'status' ||
                    dataKey === 'photo'
                ) {
                    continue;
                }

                const possibleNames = fieldMappings[dataKey] || [dataKey];

                for (const fieldName of possibleNames) {
                    let field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;

                    field = document.querySelector(
                        `input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`
                    );

                    if (!field) {
                        field = document.querySelector(
                            `input[id="${fieldName}"], textarea[id="${fieldName}"], select[id="${fieldName}"]`
                        );
                    }

                    if (!field) {
                        const allInputs = document.querySelectorAll('input, textarea, select');
                        field = Array.from(allInputs).find((input) => {
                            const name = input.getAttribute('name')?.toLowerCase();
                            const id = input.getAttribute('id')?.toLowerCase();
                            const fieldNameLower = fieldName.toLowerCase();
                            return name === fieldNameLower || id === fieldNameLower;
                        }) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
                    }

                    if (!field) {
                        const allInputs = document.querySelectorAll('input, textarea, select');
                        field = Array.from(allInputs).find((input) => {
                            const name = input.getAttribute('name')?.toLowerCase();
                            const id = input.getAttribute('id')?.toLowerCase();
                            const fieldNameLower = fieldName.toLowerCase();
                            return name?.includes(fieldNameLower) || id?.includes(fieldNameLower);
                        }) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
                    }

                    if (field) {
                        setFieldValue(field, value, dataKey);
                        fieldsFound++;
                        break;
                    }
                }
            }

            console.log(`Form Filler: Filled ${fieldsFound} fields`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsOpen(false);
            setSelectedId(null);
        } catch (error) {
            console.error('Error filling form:', error);
            setSelectedId(null);
        } finally {
            setFilling(false);
        }
    };

    function setFieldValue(
        field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
        value: any,
        dataKey: string,
    ): void {
        const fieldType = field.tagName.toLowerCase();

        console.log(dataKey)
        if (fieldType === 'select') {
            const selectField = field as HTMLSelectElement;
            const options = Array.from(selectField.options);
            const matchingOption = options.find(
                (opt) =>
                    opt.value.toLowerCase() === value.toString().toLowerCase() ||
                    opt.text.toLowerCase() === value.toString().toLowerCase()
            );

            if (matchingOption) {
                selectField.value = matchingOption.value;
            }
        } else if ((field as HTMLInputElement).type === 'radio') {
            const radioField = field as HTMLInputElement;
            const radioGroup = document.querySelectorAll<HTMLInputElement>(
                `input[name="${radioField.name}"]`
            );
            radioGroup.forEach((radio) => {
                if (radio.value.toLowerCase() === value.toString().toLowerCase()) {
                    radio.checked = true;
                }
            });
        } else if ((field as HTMLInputElement).type === 'checkbox') {
            (field as HTMLInputElement).checked = Boolean(value);
        } else if ((field as HTMLInputElement).type === 'date') {
            (field as HTMLInputElement).value = value;
        } else {
            (field as HTMLInputElement | HTMLTextAreaElement).value = value;
        }

        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));

        highlightField(field);
    }

    function highlightField(field: HTMLElement): void {
        const originalBackground = field.style.background;
        const originalTransition = field.style.transition;

        field.style.transition = 'background 0.3s ease';
        field.style.background = '#d1fae5';

        setTimeout(() => {
            field.style.background = originalBackground;
            setTimeout(() => {
                field.style.transition = originalTransition;
            }, 300);
        }, 1000);
    }

    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower === 'approved') return 'bg-green-100 text-green-800';
        if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
        if (statusLower === 'rejected') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Toggle Form Auto-Filler"
            >
                <img src={Logo} alt="CRXJS logo" className="w-6 h-6" />
            </button>

            {/* Dialog/Popup */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-40">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                            <h1 className="text-2xl font-bold">Form Auto-Filler</h1>
                            <p className="text-blue-100 text-sm mt-1">Select a candidate to fill the form</p>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-white hover:text-blue-100 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="animate-spin mb-4">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 text-sm">Loading candidates...</p>
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 px-4">
                                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                                    </svg>
                                    <p className="text-gray-600 font-medium">No candidates available</p>
                                    <p className="text-gray-400 text-sm mt-1">Add candidates from your application</p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-3">
                                    {candidates.map((candidate) => (
                                        <button
                                            key={candidate.id}
                                            onClick={() => fillForm(candidate)}
                                            disabled={filling && selectedId === candidate.id}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                                                selectedId === candidate.id && filling
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                            }`}
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                                    {getInitials(candidate.first_name, candidate.last_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                                                        {candidate.first_name} {candidate.middle_name || ''} {candidate.last_name}
                                                    </h3>
                                                    <p className="text-gray-500 text-xs">📘 {candidate.passport_number}</p>
                                                </div>
                                            </div>

                                            {/* Card Details */}
                                            <div className="space-y-1 mb-3 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Gender:</span>
                                                    <span className="font-medium text-gray-900">{capitalizeFirst(candidate.gender)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">DOB:</span>
                                                    <span className="font-medium text-gray-900">{formatDate(candidate.date_of_birth)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Mobile:</span>
                                                    <span className="font-medium text-gray-900 truncate">{candidate.mobile_number}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Email:</span>
                                                    <span className="font-medium text-gray-900 truncate text-right">{candidate.email}</span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(candidate.status)}`}>
                                                    {candidate.status}
                                                </span>
                                                {selectedId === candidate.id && filling && (
                                                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                        <span className="animate-spin inline-block">⟳</span>
                                                        Filling...
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
