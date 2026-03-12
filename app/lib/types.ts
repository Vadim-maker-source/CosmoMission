export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    age: number;
    phone: string;
    role: string;
    avatar?: string;
    region?: string;
    createdAt: Date;
    updatedAt: Date;
}