import libCom from '../../../SAPAssetManager/Rules/Common/Library/CommonLibrary';
import { StatusTransitionTextsVar } from '../../../SAPAssetManager/Rules/Common/Library/GlobalStatusTransitionTexts';
import Logger from '../../../SAPAssetManager/Rules/Log/Logger';
import libMobile from '../../../SAPAssetManager/Rules/MobileStatus/MobileStatusLibrary';
import MobileStatusUpdateActionsOrRulesSequence from '../../../SAPAssetManager/Rules/MobileStatus/MobileStatusUpdateActionsOrRulesSequence';
import MobileStatusUpdateResultsClass from '../../../SAPAssetManager/Rules/MobileStatus/MobileStatusUpdateResultsClass';
import IsPhaseModelEnabled from '../../../SAPAssetManager/Rules/Common/IsPhaseModelEnabled';
import UserFeaturesLibrary from '../../../SAPAssetManager/Rules/UserFeatures/UserFeaturesLibrary';
import ValidationLibrary from '../../../SAPAssetManager/Rules/Common/Library/ValidationLibrary';
import RunMobileStatusUpdateSequence from './RunMobileStatusUpdateSequence';
//new imports
import FormInstanceListQueryOptions from '../../../SAPAssetManager/Rules/Forms/SDF/FormInstanceListQueryOptions';
import FormRunnerNav from '../../../SAPAssetManager/Rules/Forms/SDF/FormRunnerNav';


export default async function CheckFormStatus(context, bindingObject, status, index, savedSequences) {
    Logger.debug("MyLogs ", "CheckFormStatus started")
    //let userClickedStatus = context.binding?.OperationMobileStatus_Nav?.OverallStatusCfg_Nav?.OverallStatusLabel;
    let userClickedStatus = context?.getTitle();
    Logger.debug("MyLogs ", "CheckFormStatus userClickedStatus: " + JSON.stringify(userClickedStatus));
    const queryOptions = FormInstanceListQueryOptions(context, false, false);
    const service = '/SAPAssetManager/Services/AssetManager.service';
    const entityReadLink = context.binding['@odata.readLink'];
    const entitySet = entityReadLink + '/DynamicFormLinkage_Nav';
    return context.read(service, entitySet, [], queryOptions)
        .then(result => {
            if (result && result.length > 0) {
                Logger.debug("MyLogs ", "CheckFormStatus- Result:  " + JSON.stringify(result));
                Logger.debug("MyLogs ", "CheckFormStatus- Result first item:  " + JSON.stringify(result.getItem(0)));
                //openForm(context, result.getItem(0), bindingObject, status, index, savedSequences);
                filterFormsData(context, bindingObject, status, index, savedSequences, result, userClickedStatus);
                //filterFormsData(context, result,status.MobileStatus)
            } else {
                Logger.debug("MyLogs ", "CheckFormStatus- Result empty");
                RunMobileStatusUpdateSequence(context, bindingObject, status, index, savedSequences)
            }
        })
        .catch(error => {
            Logger.debug("MyLogs ", "CheckFormStatus- Result error:" + error);
            throw error;
        });
}

function buttonFormMapping(buttonStatus) {
    if (buttonStatus) {
        // Accept and Transfer will be handled in default block
        switch (buttonStatus) {
            case 'DEPART':
                return 'PRE-TRAVEL';
            case 'CLOCK IN':
                return 'DRA';
            case 'SUSPEND':
                return 'SUSPEND';
            case 'COMPLETE':
                return 'COMPLETION';
            default:
                return '';
        }
    }
}

function filterFormsData(context, bindingObject, status, index, savedSequences, forms, buttonStatus) {
    Logger.debug("MyLogs ", "CheckFormStatus filterFormsData forms" + JSON.stringify(forms))
    Logger.debug("MyLogs ", "CheckFormStatus filterFormsData buttonStatus" + JSON.stringify(buttonStatus))

    var formType = buttonFormMapping(buttonStatus.toUpperCase())
    Logger.debug("MyLogs ", "CheckFormStatus filterFormsData formType" + JSON.stringify(formType))

    if (formType == '') {
        RunMobileStatusUpdateSequence(context, bindingObject, status, index, savedSequences)
    }
    else {
        var filteredForms = forms.filter(form => {
            Logger.debug("MyLogs ", "CheckFormStatus formtype" + formType);
            Logger.debug("MyLogs ", "CheckFormStatus form.FormName.includes(formType)" + form.FormName.includes(formType));
            Logger.debug("MyLogs ", "CheckFormStatus form.DynamicFormInstance_Nav.FormStatus" + form.DynamicFormInstance_Nav.FormStatus);
            return form.FormName.includes(formType) && form.DynamicFormInstance_Nav.FormStatus != 'Completed';
        });
        Logger.debug("MyLogs ", "CheckFormStatus filtered form result" + JSON.stringify(filteredForms))

        if (filteredForms.length > 0) {
            Logger.debug("MyLogs ", "CheckFormStatus unfiltered form" + JSON.stringify(filteredForms));
            openForm(context, filteredForms.getItem(0));
        }
        else {
            Logger.debug("MyLogs ", "CheckFormStatus filtered form no data");
            //RunMobileStatusUpdateSequence(context, bindingObject, buttonStatus, index, savedSequences);
            RunMobileStatusUpdateSequence(context, bindingObject, status, index, savedSequences)
        }
    }
}

function openForm(context, odataForms, bindingObject, status, index, savedSequences) {
    Logger.debug("MyLogs ", "CheckFormStatus open form 1" + JSON.stringify(odataForms))
    context.getAppClientData().ocontext = context;
    Logger.debug("MyLogs ", "CheckFormStatus Context")

    context.getAppClientData().olvbindingObject = bindingObject;
    Logger.debug("MyLogs ", "CheckFormStatus binding" + JSON.stringify(bindingObject))

    context.getAppClientData().olvstatus = status;
    Logger.debug("MyLogs ", "CheckFormStatus status" + JSON.stringify(status))

    context.getAppClientData().olvindex = index;
    Logger.debug("MyLogs ", "CheckFormStatus index" + JSON.stringify(index))

    context.getAppClientData().olvsavedSequences = savedSequences;
    Logger.debug("MyLogs ", "CheckFormStatus sequences" + JSON.stringify(savedSequences))

    FormRunnerNav(context,odataForms);
    Logger.debug("MyLogs ", "CheckFormStatus open form 2")
}