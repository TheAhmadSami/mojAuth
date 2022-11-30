import {action, computed, makeObservable, observable} from 'mobx';
import {User, UserManager} from 'oidc-client-ts';
import {authTsConfig} from './authTsConfig';
import userProfileService from '@common/services/user-profile.service';
import GenericResponse from '@common/models/GenericResponse';
import {UserDetails} from '@common/models/UserDetails';
import {loaderStore} from './loader.store';
import {insertSlash} from '@common/utils/date-utils';

interface SellerInfo {
  idType: number;
  dobHijri: string;
  id: number;
}

class AuthenticationStore {
  public manager: UserManager;
  
  constructor() {
    makeObservable(this);
    // this.manager = new UserManager(authConfig);
    this.manager = new UserManager(authTsConfig);
    this.loadUser();
    this.manager.events.addSilentRenewError(error => {
      console.log(error.message, error.stack);
    });
    this.manager.events.addAccessTokenExpiring(() => {
      this.isTokenExpiring = true;
    });
    this.manager.events.addUserSignedIn(() => {
      this.isTokenExpiring = false;
    });
    this.manager.events.addUserSignedOut(() => {
      this.isTokenExpiring = false;
    });
    this.manager.events.addAccessTokenExpired(() => {
      this.isTokenExpiring = false;
      this.logout();
    });
    this.manager.events.addUserLoaded(user => {
      this.user = user;
      loaderStore.setLoader(false);
      this.isTokenExpiring = false;
    });
    this.manager.events.addSilentRenewError(function () {
      console.error('Silent Renew Error：', arguments);
    });
  }

  @observable user: User | null | undefined = undefined;
  @observable isUserLoggedIn: boolean = this.isLoggedIn;
  @observable userDetails!: UserDetails;
  @observable isTokenExpiring: boolean = false;
  @observable isLoginRequired: boolean = false;
  @observable isLoadingUser: boolean = false;
  public loadedProfile = false;
  public loadingProfile = false;
  public errorTemplate = '';
  @observable noProfile = false;
  public noIbans = false;
  @computed

  get isLoggedIn(): boolean {
    return (
      this.user != null && this.user.access_token != null && !this.user.expired
    );
  }

  @action
  requireLoginPopup() {
    this.isLoginRequired = true;
  }

  @action
  hideLoginPopup() {
    this.isLoginRequired = false;
  }

  @action.bound
  loadUser() {
    loaderStore.setLoader(true);
    return this.manager.getUser().then(user => {
      loaderStore.setLoader(false);
      this.user = user;
      return user;
    });
  }
  
  @action.bound
  login(path?: string) {
    sessionStorage.setItem('path', path!!);
    this.manager.signinRedirect().catch(error => this.handleError(error));
  }

  @action
  silentLogin() {
    loaderStore.setLoader(true);
    return this.manager
      .signinSilent()
      .then(user => {
        loaderStore.setLoader(false);
        this.user = user;
        return user;
      })
      .catch(error => this.handleError(error));
  }

  @action.bound
  completeLogin() {
    loaderStore.setLoader(true);
    return this.manager
      .signinRedirectCallback()
      .then(user => {
        loaderStore.setLoader(false);
        this.user = user;
        return user;
      })
      .catch(error => this.handleError(error));
  }

  @action.bound
  completeSilentLogin() {
    loaderStore.setLoader(true);
    return this.manager.signinSilentCallback().then(user => {
      loaderStore.setLoader(false);
      // this.user = user;
    });
  }

  @action.bound
  logout() {
    this.manager.signoutRedirect().catch(error => this.handleError(error));
    attorneyStore.clearAttorney();
  }

  @action.bound
  completeLogout() {
    loaderStore.setLoader(true);
    this.manager
      .signoutRedirectCallback()
      .then(() => {
        this.manager.removeUser();
      })
      .then(() => {
        loaderStore.setLoader(false);
        this.user = null;
      })
      .catch(error => {
        loaderStore.setLoader(false);
        this.handleError(error);
      });
  }

  @action.bound
  setTokenExpired() {
    this.isTokenExpiring = true;
  }

  @action.bound
  getUserProfile(forStore = false) {
    if (forStore && this.loadedProfile) {
      return new Promise(r => r(this.userDetails));
    } else {
      if (forStore) {
        this.loadedProfile = true;
      }
    }
    this.loadingProfile = true;
    return userProfileService
      .getUserProfileInfo()
      .then((res: GenericResponse) => {
        this.loadingProfile = false;
        if (res.IsSuccess && res.Data && res.Data.Ibans.length > 0) {
          this.userDetails = res.Data;
          this.errorTemplate = '';
          this.noProfile = false;
          return res.Data;
        } else if (res.IsSuccess && res.Data && res.Data.Ibans.length === 0) {
          this.userDetails = res.Data;
          this.errorTemplate = '';
          this.noProfile = false;
          this.noIbans = true;
          return res.Data;
        } else if (!res.IsSuccess && res.HttpCode === 200) {
          this.noProfile = true;
          this.errorTemplate = '';
          return res;
        } else {
          this.loadedProfile = false;
          if (res.HttpCode === 400 && res.ErrorDetails) {
            this.errorTemplate = res.ErrorDetails.map(
              error => error.ErrorDescription,
            )
              .join('\n')
              .toString();
          }
          return res;
        }
      });
  }

  @action
  loadingUser(loading: boolean) {
    this.isLoadingUser = loading;
  }

  @action.bound
  handleError(error: any) {
    loaderStore.setLoader(false);
    console.error('Problem with authentication endpoint: ', error);
  }

  @action
  setProfile() {
    this.noProfile = false;
  }

  @action.bound
  getSellerInfo(): SellerInfo {
    const attorney = attorneyStore.attorney;
    if (attorneyStore.attorney?.PersonInfo) {
      return {
        id: attorney?.PersonInfo?.SocialId!!,
        idType: attorney?.PersonInfo?.SocialIdType!!,
        dobHijri: insertSlash(`${attorney?.PersonInfo?.BirthDateHijri}`),
      };
    } else if (attorneyStore.attorney?.CompanyInfo) {
      return {
        id: attorney?.CompanyInfo?.socialId!!,
        idType: attorney?.CompanyInfo?.socialIdType!!,
        dobHijri: insertSlash(`${attorney?.CompanyInfo?.birthDateHijri}`),
      };
    } else if (this.userDetails) {
      return {
        id: +this.userDetails.IdentityNo,
        idType: this.userDetails.IdentityType,
        dobHijri: insertSlash(`${this.userDetails.DateOfBirthHijri}`),
      };
    } else
      return {
        id: 0,
        idType: 0,
        dobHijri: '',
      };
  }
  
}

export const authStore = new AuthenticationStore();
