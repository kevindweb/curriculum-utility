import * as React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';

interface AlertDialogProps {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    title: string,
    message: string,
    onContinue: () => void;
    onCancel: () => void;
}

export default function AlertDialog(props: AlertDialogProps) {
    const handleCancel = () => {
        props.setOpen(false);
        props.onCancel?.();
    }

    const handleContinue = () => {
        props.setOpen(false);
        props.onContinue?.();
    }

    return (
        <Dialog
            open={props.open}
            onClose={handleCancel}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {props.message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleContinue} color="primary" autoFocus>
                    Continue
                </Button>
            </DialogActions>
        </Dialog>
    )
}