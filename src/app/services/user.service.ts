import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {apiUrl} from '../../environments/environment';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {catchError, map,tap} from 'rxjs/operators';
import {JwtResponse} from '../response/JwtResponse';
import {CookieService} from 'ngx-cookie-service';
import {User} from '../models/User';
import { UserListResponse} from '../response/user-list-response'


@Injectable({
    providedIn: 'root'
})
export class UserService {

    private currentUserSubject: BehaviorSubject<JwtResponse>;
    public currentUser: Observable<JwtResponse>;
    public nameTerms = new Subject<string>();
    public name$ = this.nameTerms.asObservable();
    constructor(private http: HttpClient,
                private cookieService: CookieService) {
        const memo = localStorage.getItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<JwtResponse>(JSON.parse(memo));
        this.currentUser = this.currentUserSubject.asObservable();
        cookieService.set('currentUser', memo);
    }

    get currentUserValue() {
        return this.currentUserSubject.value;
    }


    login(loginForm): Observable<JwtResponse> {
        const url = `${apiUrl}/login`;
        return this.http.post<JwtResponse>(url, loginForm).pipe(
            tap(user => {
                console.log(user);
                
                if (user && user.token) {
                    this.cookieService.set('currentUser', JSON.stringify(user));
                     
                    if (loginForm.remembered) {
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    }
                    console.log((user.name));
                    this.nameTerms.next(user.name);
                    this.currentUserSubject.next(user);
                    return user;
                }
            }),
            catchError(this.handleError('Login Failed', null))
        );
    }

    logout() {
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
        this.cookieService.delete('currentUser');
    }

    signUp(user: User): Observable<User> {
        const url = `${apiUrl}/register`;
        return this.http.post<User>(url, user);
    }

    update(user: User): Observable<User> {
        const url = `${apiUrl}/profile`;
        return this.http.put<User>(url, user);    }

    get(email: string): Observable<User> {
        const url = `${apiUrl}/profile/${email}`;
        return this.http.get<User>(url);
    }

    addAdmin(email: string): Observable<User> {
        const url = `${apiUrl}/add/admin/${email}`;
        return this.http.patch<User>(url,null);
    }

    removeAdmin(email: string): Observable<User> {
        const url = `${apiUrl}/remove/admin/${email}`;
        return this.http.patch<User>(url,null);
    }
    removeUser(email: string): Observable<User> {
        const url = `${apiUrl}/remove/user/${email}`;
        return this.http.delete<User>(url);
    }

    getUsers(): Observable<User[]>{
        const url = `${apiUrl}/getusers`;
        return this.http.get<UserListResponse>(url).pipe(
            tap(_ => {
                
            }),
            map(userResponse => userResponse.user),
            catchError(_ => of([]))
        );;
        
    }

    getPage(page = 1, size = 10): Observable<any> {
        return this.http.get(`${apiUrl}/getusers?page=${page}&size=${size}`).pipe();
    }

    /**
     * Handle Http operation that failed.
     * Let the app continue.
     * @param operation - name of the operation that failed
     * @param result - optional value to return as the observable result
     */
    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {

            console.log(error); // log to console instead

            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }
}
